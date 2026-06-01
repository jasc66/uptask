import Joyride, { STATUS } from 'react-joyride'
import useOnboarding from '../hooks/useOnboarding'

const PASOS = [
    {
        target: 'body',
        placement: 'center',
        title: '👋 Bienvenido a Nexo',
        content: 'Tu gestor de proyectos y tareas colaborativo. Este tour rápido te mostrará las partes principales de la app. ¡Solo toma un minuto!',
        disableBeacon: true,
    },
    {
        target: '[data-tour="sidebar-nav"]',
        placement: 'right',
        title: '📍 Navegación principal',
        content: 'Accede a tus proyectos, tareas pendientes, notificaciones, portafolios y reportes desde aquí.',
        disableBeacon: true,
    },
    {
        target: '[data-tour="nuevo-proyecto"]',
        placement: 'top',
        title: '➕ Crear proyectos',
        content: 'Haz clic aquí para crear tu primer proyecto. Podrás agregarle tareas, colaboradores, etiquetas y mucho más.',
        disableBeacon: true,
    },
    {
        target: '[data-tour="checklist"]',
        placement: 'right',
        title: '🎯 Primeros pasos',
        content: 'Esta guía te acompañará mientras descubres Nexo. Completa cada tarea para familiarizarte con la app.',
        disableBeacon: true,
    },
    {
        target: 'body',
        placement: 'center',
        title: '🚀 ¡Estás listo!',
        content: 'Ya conoces lo básico. Crea tu primer proyecto y empieza a organizar tu trabajo con tu equipo.',
        disableBeacon: true,
    },
]

const estilos = {
    options: {
        primaryColor: '#6366f1',
        textColor: '#334155',
        backgroundColor: '#ffffff',
        arrowColor: '#ffffff',
        zIndex: 10000,
    },
    tooltip: {
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        padding: '20px 24px',
    },
    tooltipTitle: {
        fontSize: '15px',
        fontWeight: '700',
        marginBottom: '8px',
        color: '#1e293b',
    },
    tooltipContent: {
        fontSize: '13px',
        lineHeight: '1.6',
        color: '#475569',
        padding: '0',
    },
    buttonNext: {
        backgroundColor: '#6366f1',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '600',
        padding: '8px 16px',
    },
    buttonBack: {
        color: '#6366f1',
        fontSize: '13px',
        fontWeight: '500',
        marginRight: '8px',
    },
    buttonSkip: {
        color: '#94a3b8',
        fontSize: '12px',
    },
    spotlight: {
        borderRadius: '10px',
    },
}

const locale = {
    back: 'Anterior',
    close: 'Cerrar',
    last: '¡Listo!',
    next: 'Siguiente',
    skip: 'Saltar tour',
}

const OnboardingTour = ({ corriendo, onTerminar }) => {
    const { marcarTourHecho } = useOnboarding()

    const handleCallback = ({ status }) => {
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            marcarTourHecho()
            onTerminar?.()
        }
    }

    return (
        <Joyride
            steps={PASOS}
            run={corriendo}
            continuous
            showSkipButton
            showProgress
            scrollToFirstStep
            styles={estilos}
            locale={locale}
            callback={handleCallback}
        />
    )
}

export default OnboardingTour
