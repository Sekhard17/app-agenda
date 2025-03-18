# Propuestas de Solución - Sistema de Supervisión REX

## Configuración API REX
```typescript
const API_CONFIG = {
    BASE_URL: 'https://socoepa.rexmas.cl/api/v2',
    TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjQsInZhbGlkIjozLCJ1c2VybmFtZSI6InNvY29lcGEiLCJjcmVhdGlvbl90aW1lIjoxNzI0MzM3OTk1LjIzMTMwNX0.TKp0NE4xtsoBoSKeT7SlbUWt6m78b6kqCB8YP-tNJsw',
    ENDPOINTS: {
        VALIDAR_RUT: '/empleados/rut/',
        CONTRATOS: '/empleados/rut/contratos/numerocontrato'
    }
};
```

## Solución 1: Cache Rolling con Histórico en Storage

### Descripción
Sistema híbrido que mantiene datos recientes en Supabase DB y datos históricos en Storage, optimizando rendimiento y recursos.

### Ventajas
- ✅ Consultas rápidas para datos recientes
- ✅ Optimización de recursos Supabase
- ✅ Historial completo mantenido
- ✅ Escalable y eficiente

### Desventajas
- ❌ Mayor complejidad de implementación
- ❌ Latencia en consultas históricas
- ❌ Requiere mantenimiento de dos sistemas

### Implementación

#### 1. Estructura Base de Datos
```sql
-- Tabla de relaciones actuales (últimos 3 meses)
CREATE TABLE supervisor_relaciones_actual (
    id SERIAL PRIMARY KEY,
    rut_funcionario VARCHAR(12) NOT NULL,
    rut_supervisor VARCHAR(12) NOT NULL,
    nombre_funcionario VARCHAR(100),
    nombre_supervisor VARCHAR(100),
    fecha_registro DATE NOT NULL,
    hash_datos VARCHAR(32) NOT NULL,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rut_funcionario, fecha_registro)
);

-- Índices optimizados
CREATE INDEX idx_fecha_supervisor ON supervisor_relaciones_actual(rut_supervisor, fecha_registro);
CREATE INDEX idx_fecha ON supervisor_relaciones_actual(fecha_registro);
```

#### 2. Servicio de Actualización
```typescript
interface EmpleadoRex {
    rut: string;
    nombre: string;
    contratos: {
        numerocontrato: string;
        rut_supervisor: string;
    }[];
}

class SupervisorService {
    async obtenerDatosEmpleado(rut: string): Promise<EmpleadoRex> {
        const headers = {
            'Authorization': `Token ${API_CONFIG.TOKEN}`
        };

        const empleadoResponse = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VALIDAR_RUT}${rut}`,
            { headers }
        );
        const empleado = await empleadoResponse.json();

        const contratosResponse = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTRATOS}/${empleado.numerocontrato}`,
            { headers }
        );
        const contratos = await contratosResponse.json();

        return {
            ...empleado,
            contratos
        };
    }

    async actualizarCache(): Promise<void> {
        const funcionariosActivos = await this.obtenerFuncionariosActivos();
        
        for (const funcionario of funcionariosActivos) {
            const datosRex = await this.obtenerDatosEmpleado(funcionario.rut);
            const hashActual = this.calcularHash(datosRex);
            
            await this.actualizarRegistro(funcionario, datosRex, hashActual);
        }
    }
}
```

#### 3. Sistema de Archivado
```typescript
class ArchivoService {
    private readonly RETENTION_MONTHS = 3;

    async archivarDatosHistoricos(): Promise<void> {
        const fechaCorte = new Date();
        fechaCorte.setMonth(fechaCorte.getMonth() - this.RETENTION_MONTHS);

        // Obtener datos a archivar
        const { data: datosParaArchivar } = await supabase
            .from('supervisor_relaciones_actual')
            .select()
            .lt('fecha_registro', fechaCorte.toISOString());

        if (!datosParaArchivar?.length) return;

        // Preparar archivo histórico
        const trimestre = Math.floor(fechaCorte.getMonth() / 3) + 1;
        const año = fechaCorte.getFullYear();
        const nombreArchivo = `${año}/Q${trimestre}_${año}_supervisores.json`;

        // Subir a storage
        await supabase.storage
            .from('historico')
            .upload(nombreArchivo, JSON.stringify(datosParaArchivar));

        // Limpiar datos antiguos
        await supabase
            .from('supervisor_relaciones_actual')
            .delete()
            .lt('fecha_registro', fechaCorte.toISOString());
    }
}
```

#### 4. Programación de Tareas
```typescript
// Actualización diaria de cache (00:01 AM)
cron.schedule('1 0 * * *', async () => {
    const supervisorService = new SupervisorService();
    await supervisorService.actualizarCache();
});

// Archivado trimestral
cron.schedule('0 0 1 */3 *', async () => {
    const archivoService = new ArchivoService();
    await archivoService.archivarDatosHistoricos();
});
```

---

## Solución 2: Tabla Única con Actualización Selectiva

### Descripción
Sistema unificado que mantiene todos los datos en una única tabla de Supabase, con optimizaciones para rendimiento y almacenamiento.

### Ventajas
- ✅ Sistema más simple de mantener
- ✅ Consultas uniformes
- ✅ No requiere sincronización entre sistemas
- ✅ Más fácil de debuggear

### Desventajas
- ❌ Mayor uso de Supabase DB
- ❌ Posible degradación de rendimiento
- ❌ Menos flexible para escalar

### Implementación

#### 1. Estructura Base de Datos
```sql
-- Tabla principal de relaciones
CREATE TABLE supervisor_relaciones (
    id SERIAL PRIMARY KEY,
    rut_funcionario VARCHAR(12) NOT NULL,
    rut_supervisor VARCHAR(12) NOT NULL,
    nombre_funcionario VARCHAR(100),
    nombre_supervisor VARCHAR(100),
    fecha_registro DATE NOT NULL,
    hash_datos VARCHAR(32) NOT NULL,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    UNIQUE(rut_funcionario, fecha_registro)
);

-- Particionamiento por rango de fechas
CREATE TABLE supervisor_relaciones_y2024m1_3 PARTITION OF supervisor_relaciones
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

-- Índices optimizados
CREATE INDEX idx_supervisor_fecha ON supervisor_relaciones(rut_supervisor, fecha_registro);
CREATE INDEX idx_funcionario_fecha ON supervisor_relaciones(rut_funcionario, fecha_registro);
```

#### 2. Servicio de Actualización
```typescript
class SupervisorServiceUnificado {
    async actualizarRelaciones(): Promise<void> {
        const funcionariosActivos = await this.obtenerFuncionariosActivos();
        
        for (const funcionario of funcionariosActivos) {
            const datosRex = await this.obtenerDatosEmpleado(funcionario.rut);
            const hashActual = this.calcularHash(datosRex);
            
            // Verificar si necesita actualización
            const registroExistente = await this.obtenerRegistroActual(funcionario.rut);
            
            if (!registroExistente || registroExistente.hash_datos !== hashActual) {
                await this.actualizarRegistro(funcionario, datosRex, hashActual);
            }
        }
    }

    private async obtenerDatosEmpleado(rut: string): Promise<EmpleadoRex> {
        const headers = {
            'Authorization': `Token ${API_CONFIG.TOKEN}`
        };

        const [empleadoResponse, contratosResponse] = await Promise.all([
            fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VALIDAR_RUT}${rut}`, { headers }),
            fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTRATOS}/numerocontrato`, { headers })
        ]);

        const [empleado, contratos] = await Promise.all([
            empleadoResponse.json(),
            contratosResponse.json()
        ]);

        return {
            ...empleado,
            contratos
        };
    }
}
```

#### 3. Sistema de Consulta
```typescript
class ConsultaServiceUnificado {
    async obtenerRelacionSupervisor(
        fecha: Date, 
        rut: string
    ): Promise<any> {
        const { data, error } = await supabase
            .from('supervisor_relaciones')
            .select()
            .match({ rut_funcionario: rut })
            .eq('fecha_registro', fecha.toISOString())
            .single();

        if (error) {
            console.error('Error al consultar relación:', error);
            return null;
        }

        return data;
    }

    async obtenerSupervisados(
        rutSupervisor: string, 
        fecha: Date
    ): Promise<any[]> {
        const { data, error } = await supabase
            .from('supervisor_relaciones')
            .select()
            .match({ rut_supervisor: rutSupervisor })
            .eq('fecha_registro', fecha.toISOString());

        if (error) {
            console.error('Error al consultar supervisados:', error);
            return [];
        }

        return data || [];
    }
}
```

#### 4. Sistema de Mantenimiento
```typescript
class MantenimientoService {
    async comprimirDatosAntiguos(): Promise<void> {
        const fechaCorte = new Date();
        fechaCorte.setMonth(fechaCorte.getMonth() - 6);

        await supabase
            .from('supervisor_relaciones')
            .update({ activo: false })
            .lt('fecha_registro', fechaCorte.toISOString())
            .eq('activo', true);
    }

    async crearNuevaParticion(): Promise<void> {
        const año = new Date().getFullYear();
        const trimestre = Math.floor(new Date().getMonth() / 3) + 1;
        
        const sqlQuery = `
            CREATE TABLE IF NOT EXISTS supervisor_relaciones_y${año}q${trimestre} 
            PARTITION OF supervisor_relaciones
            FOR VALUES FROM ('${año}-${trimestre*3-2}-01') 
            TO ('${año}-${trimestre*3+1}-01')
        `;

        await supabase.rpc('execute_sql', { query: sqlQuery });
    }
}
```

#### 5. Programación de Tareas
```typescript
// Actualización diaria
cron.schedule('1 0 * * *', async () => {
    const service = new SupervisorServiceUnificado();
    await service.actualizarRelaciones();
});

// Mantenimiento mensual
cron.schedule('0 0 1 * *', async () => {
    const mantenimiento = new MantenimientoService();
    await mantenimiento.comprimirDatosAntiguos();
});

// Crear nueva partición (trimestral)
cron.schedule('0 0 1 */3 *', async () => {
    const mantenimiento = new MantenimientoService();
    await mantenimiento.crearNuevaParticion();
});
```

## Recomendación Final

Se recomienda implementar la **Solución 1: Cache Rolling con Histórico en Storage** por las siguientes razones:

1. Mejor optimización de recursos de Supabase
2. Mayor escalabilidad a largo plazo
3. Separación clara entre datos activos e históricos
4. Mejor rendimiento en consultas frecuentes

La complejidad adicional de implementación se compensa con los beneficios en rendimiento y escalabilidad. 