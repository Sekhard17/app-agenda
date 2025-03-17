import { useCallback, useContext, useEffect } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import { useTheme } from '@mui/material';
import { ThemeContext } from '../context/ThemeContext';

const ParticlesBackground = () => {
  const theme = useTheme();
  const { mode } = useContext(ThemeContext);
  
  const particlesInit = useCallback(async (engine: any) => {
    console.log('Initializing particles...');
    await loadSlim(engine);
  }, []);
  
  // Efecto para registrar cuando el componente se monta
  useEffect(() => {
    console.log('ParticlesBackground mounted');
    return () => console.log('ParticlesBackground unmounted');
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        margin: 0,
        padding: 0,
      }}
      options={{
        fullScreen: {
          enable: false,
          zIndex: -1,
        },
        fpsLimit: 60,
        particles: {
          number: {
            value: 50,
            density: {
              enable: true,
              value_area: 800,
            },
          },
          color: {
            value: mode === 'light' ? '#1976d2' : '#90caf9',
          },
          shape: {
            type: "circle",
          },
          opacity: {
            value: mode === 'light' ? 0.2 : 0.3,
            random: true,
            anim: {
              enable: true,
              speed: 1,
              opacity_min: 0.1,
              sync: false,
            },
          },
          size: {
            value: 3,
            random: true,
            anim: {
              enable: true,
              speed: 2,
              size_min: 0.3,
              sync: false,
            },
          },
          line_linked: {
            enable: true,
            distance: 150,
            color: mode === 'light' ? '#1976d2' : '#90caf9',
            opacity: mode === 'light' ? 0.2 : 0.3,
            width: 1,
          },
          move: {
            enable: true,
            speed: 1,
            direction: "none",
            random: true,
            straight: false,
            out_mode: "out",
            bounce: false,
            attract: {
              enable: false,
              rotateX: 600,
              rotateY: 1200,
            },
          },
        },
        interactivity: {
          detect_on: "canvas",
          events: {
            onhover: {
              enable: true,
              mode: "grab",
            },
            onclick: {
              enable: true,
              mode: "push",
            },
            resize: true,
          },
          modes: {
            grab: {
              distance: 140,
              line_linked: {
                opacity: 1,
              },
            },
            bubble: {
              distance: 400,
              size: 40,
              duration: 2,
              opacity: 8,
              speed: 3,
            },
            repulse: {
              distance: 200,
              duration: 0.4,
            },
            push: {
              particles_nb: 4,
            },
            remove: {
              particles_nb: 2,
            },
          },
        },
        retina_detect: true,
        background: {
          color: {
            value: theme.palette.background.default,
          },
          position: "50% 50%",
          repeat: "no-repeat",
          size: "cover",
        },
      }}
    />
  );
};

export default ParticlesBackground;
