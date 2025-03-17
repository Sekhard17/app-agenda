// src/models/documento.model.ts
// Este modelo maneja la interacción con la tabla de documentos en la base de datos

import supabase from '../config/supabase'
import { Documento, DocumentoCrear } from '../types/documentos.types'

// Obtener un documento por ID
export const obtenerDocumentoPorId = async (id: string) => {
  const { data, error } = await supabase
    .from('documentos')
    .select('*, actividades(id, titulo, fecha)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Obtener documentos de una actividad
export const obtenerDocumentosPorActividad = async (actividadId: string) => {
  const { data, error } = await supabase
    .from('documentos')
    .select('*')
    .eq('id_actividad', actividadId)
    .order('fecha_creacion', { ascending: false })

  if (error) throw error
  return data
}

// Crear un nuevo documento
export const crearDocumento = async (documento: DocumentoCrear) => {
  const { data, error } = await supabase
    .from('documentos')
    .insert([documento])
    .select()
    .single()

  if (error) throw error
  return data
}

// Eliminar un documento
export const eliminarDocumento = async (id: string) => {
  // Primero obtener la ruta del archivo para eliminarlo del storage
  const { data: documento, error: errorConsulta } = await supabase
    .from('documentos')
    .select('ruta_archivo')
    .eq('id', id)
    .single()

  if (errorConsulta) throw errorConsulta

  // Extraer el nombre del archivo de la ruta
  const rutaArchivo = documento.ruta_archivo.split('/').pop()
  
  // Eliminar el archivo del storage
  if (rutaArchivo) {
    const { error: errorStorage } = await supabase
      .storage
      .from('documentos')
      .remove([rutaArchivo])
    
    if (errorStorage) throw errorStorage
  }

  // Eliminar el registro de la base de datos
  const { error } = await supabase
    .from('documentos')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

// Obtener URL firmada para un documento
export const obtenerUrlFirmada = async (id: string) => {
  // Obtener la ruta del archivo
  const { data: documento, error: errorConsulta } = await supabase
    .from('documentos')
    .select('ruta_archivo')
    .eq('id', id)
    .single()

  if (errorConsulta) throw errorConsulta

  // Extraer el nombre del archivo de la ruta
  const rutaArchivo = documento.ruta_archivo.split('/').pop()
  
  if (!rutaArchivo) throw new Error('Ruta de archivo no válida')

  // Generar URL firmada
  const { data, error } = await supabase
    .storage
    .from('documentos')
    .createSignedUrl(rutaArchivo, 60 * 60) // URL válida por 1 hora

  if (error) throw error
  return data.signedUrl
}