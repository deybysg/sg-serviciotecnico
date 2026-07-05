import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FaDesktop,
  FaWindows,
  FaMobileAlt,
  FaTabletAlt,
  FaPlug,
  FaBatteryFull,
  FaShieldAlt,
  FaGem,
  FaArrowLeft,
  FaWhatsapp,
  FaCheckCircle,
} from "react-icons/fa";
import "../styles/pages/ServicioDetalle.css";

const serviciosData = [
  {
    id: 1,
    icono: <FaDesktop />,
    titulo: "REPARACIÓN DE PC",
    descripcionCorta: "Solucionamos fallas de hardware y software, limpieza, optimización y más.",
    color: "cyan",
    descripcionLarga:
      "Ofrecemos un servicio completo de reparación de computadoras. Diagnosticamos y solucionamos todo tipo de fallas, desde problemas de hardware hasta virus y errores de software.",
    imagenes: [
      "https://ik.imagekit.io/2upopbnzjh/imagenes%20de%20servicios/PliGEhGKcJYBahCXKsjvvv9Fsa9BChAD7P8MxclzVUE0rZwBCknGTk7_rAX1_WZX6rbOHPMHE_OHIFPSjIuViFriSet1SDkEk3bmi40vOf06gw8UZu4_MF6M9abrVxoX5FEQAURyj49-qDuy8QUIC4BjIBV0yxG1G7AzAXMuR6otgQDHOC4671Mr0GMHu4f4.jpg?updatedAt=1782424598283",
      "https://ik.imagekit.io/2upopbnzjh/imagenes%20de%20servicios/U4VLQ7pPvNZwxK1Wl1AFoRcDbMnB-sN04CVxxfhKrph-3eIuMpsljPSUXYYn1N2_xgNOuynoDA91YQegST4hbMwgIAf0IM2XGmP5G93paQJifffdsykkEW-G3DuN6vLyK6lWOwQJU7TsjHEO-yrU6gmNsctczbsmJXgMRU8_OxsvqORVtOiFqwculvlN2xRe.jpg?updatedAt=1782424595173",
      "https://ik.imagekit.io/2upopbnzjh/imagenes%20de%20servicios/i956aoXNhC5ksAziPATy9Gw0CIISmtKrAvkDXg2l10hLkJ6fTPEzZwSbHVaMb0b0atOhcvEzmNbSMjiWNEeT4D0-ivkcFa00lsYk4D44wSmXdSqeLAK_0HlCRG3sTiikS5_wXD8ixyQQ6cT9w-_XR1mY50ks9noiC_aIuEx1vJhQB2XiGHMDXVq1y5Ep3jsf.jpg?updatedAt=1782424594734",
    ],
    caracteristicas: [
      "Diagnóstico gratuito y sin compromiso",
      "Reparación de fallas de hardware y software",
      "Limpieza profunda interna y externa",
      "Optimización del sistema operativo",
      "Eliminación de virus y malware",
      "Recuperación de datos",
      "Actualización de componentes y drivers",
    ],
    pasos: [
      "Traé tu PC a nuestro local",
      "Realizamos un diagnóstico completo y gratuito",
      "Te presupuestamos la reparación antes de proceder",
      "Ejecutamos la reparación ",
      "Probamos y verificamos que todo funcione perfecto",
      "Te devolvemos tu PC con garantía",
    ],
  },
  {
    id: 2,
    icono: <FaWindows />,
    titulo: "INSTALACIÓN DE WINDOWS",
    descripcionCorta: "Instalación de Windows 10 / 11, drivers y programas esenciales.",
    color: "blue",
    descripcionLarga:
      "Instalamos y configuramos Windows 10 o 11 de forma profesional. Nos encargamos de todos los drivers, programas esenciales y la personalización según tus necesidades. Tu equipo listo para usar desde el primer momento.",
    imagenes: [
      "https://ik.imagekit.io/2upopbnzjh/imagenes%20de%20servicios/KypXW8bH25kqHTu6ohXVveq76W5EvTsy113kA6BYMStN-Cx6MXwuNcZ2htgWUIOz0CBk5C4_cg8Ac3vb1GOBeM48SCdJON2sSa7vZhYzXnJnomPbEMtKfXh6WOdXkoVqlcGUIKTF7VUvkPWnfMNxG4c3L6FCH34I8Rj_NhvHlsM6dDuvHJWec3OJdTnhTa7H.jpg?updatedAt=1782424595790",
      "https://ik.imagekit.io/2upopbnzjh/imagenes%20de%20servicios/i956aoXNhC5ksAziPATy9Gw0CIISmtKrAvkDXg2l10hLkJ6fTPEzZwSbHVaMb0b0atOhcvEzmNbSMjiWNEeT4D0-ivkcFa00lsYk4D44wSmXdSqeLAK_0HlCRG3sTiikS5_wXD8ixyQQ6cT9w-_XR1mY50ks9noiC_aIuEx1vJhQB2XiGHMDXVq1y5Ep3jsf.jpg?updatedAt=1782424594734",
      "https://ik.imagekit.io/2upopbnzjh/imagenes%20de%20servicios/u-3V8Yfb4cF8tFv_w6KnIfhvRTkkwNrZnYbjkuIG1hJzzXRoc52bNIZCceRpZYpEH1_gGSm1YzjvapnSEL3qRVkEOB1rkadj1gJghvVRE_y3442lgDSphLkfHEuDEOjt8-PJAV-w2-4FIujEw3rQlhgSg5Q8RhqBE6cHNe9KLbu9iOUtABCrt5zAKqFImOY1.jpg?updatedAt=1782424594724",
    ],
    caracteristicas: [
      "Instalación limpia de Windows 10 / 11",
      "Instalación de todos los drivers necesarios",
      "Programas esenciales preinstalados",
      "Configuración personalizada",
      "Activación y licenciamiento",
      "Actualizaciones completas",
    ],
    pasos: [
      "Backup de tu información importante",
      "Formateo e instalación limpia de Windows",
      "Instalación de drivers originales",
      "Carga de programas esenciales",
      "Configuración y personalización",
      "Verificación final y entrega",
    ],
  },
  {
    id: 3,
    icono: <FaMobileAlt />,
    titulo: "SERVICIO TÉCNICO DE CELULARES",
    descripcionCorta: "Reparación de fallas de software y hardware en todas las marcas.",
    color: "purple",
    descripcionLarga:
      "Somos especialistas en la reparación de celulares de todas las marcas: Samsung, iPhone, Xiaomi, Motorola, Huawei y más. Solucionamos fallas de software como pantallas de error, y problemas hardware como placas, conectores y más.",
    imagenes: [
      "https://ik.imagekit.io/2upopbnzjh/imagenes%20de%20servicios/S-m8uNKgNlvgujzwr9_hKQKxMoe5rrRSY9LiBOo5nxLsWkyGvkByoTQ-VrKrobRRq-C3XgXESZljhGNC-W60HQB-Vb4jDE88z81eS6pK3vT4pz0sbCPylfFLvAcKAXLalYTn7OE2UzlsbbD_oga_PAsUFpa9xrjBUbfIivfodSf28phFPziKGbk_AIN0iviI.jpg?updatedAt=1782424599496",
      "https://ik.imagekit.io/2upopbnzjh/imagenes%20de%20servicios/e8-mk0yh-QUfBNY1zwkrGBF80Rk7d6UE9X_AHQuGUeukw3q29KhGg2Cjw1uAKF65pEMtYyrvGLifeTRqrwyoL0eJ-CEJeDQGIglVqp6nhy9VqtUIYjNYcT3pyhb0V-QHLuKvKQc_7jJl4jwJ_LFRaNZurPx_TOuTYPNQqr_FsQUFdLe0eetqYEPqb_AD89Mw.jpg?updatedAt=1782424599161",
      "https://ik.imagekit.io/2upopbnzjh/imagenes%20de%20servicios/6v4vYlfBqZzRp2fRSoSbqeEGrpHLMBRGdGZ0fZyN7sc9AuHoVgW2eEnMxZa0hXBzXcBTUgGPLaZM43owOWgQiQOQ80EAVUGU1hZpiGetVHFapxZI61FNVp9y-Vu3FMehbJsFVswBolnkOg88ZERmyXv3cgc6RaRgncH7MtBc_S_fnYict8bXDbhQbFkhzJDw.jpg?updatedAt=1782424598700",
    ],
    caracteristicas: [
      "Reparación de todas las marcas",
      "Solución de fallas de software",
      "Reparación de componentes hardware",
      "Cambio de baterías",
      "Reparación de placas",
      "Recuperación de datos",
    ],
    pasos: [
      "Traé tu celular al local",
      "Diagnosticamos el problema",
      "Te damos un presupuesto preciso",
      "Reparamos con repuestos de calidad",
      "Probamos todas las funciones",
      "Entregamos con garantía",
    ],
  },
  {
    id: 4,
    icono: <FaTabletAlt />,
    titulo: "CAMBIO DE PANTALLA",
    descripcionCorta: "Reemplazo de pantallas quebradas con garantía.",
    color: "pink",
    descripcionLarga:
      "Reemplazamos pantallas rotas o dañadas en celulares. Trabajamos con repuestos distintas calidades y ofrecemos garantía en cada cambio. Recuperá la vista perfecta de tu dispositivo.",
    imagenes: [
      "https://ik.imagekit.io/2upopbnzjh/imagenes%20de%20servicios/s0e-VNS0jisjxnLqAab28-5C16UcS85aSnhgEx1Qt9dJ1f7nZTdzpn-jTo4H6hHcAIGg3IiQg9uJradyBcg54TtGFVIHp-f9epG70EQluHSGt6yTOWpjvU5H1dZmTDz1PpCzRSeOCQEitiaKtYyyVAqQk0oyZBk5IcG7lsUKUI8s-_iPOgtRk4sT1IaBx0hV.jpg?updatedAt=1782424600089",
      "https://ik.imagekit.io/2upopbnzjh/imagenes%20de%20servicios/YO_jJJmD9WU_cNzSznVg1I2b7Mlrk2sESM1B4w8_2HmWommFL6fmBkLKPELP_wZfV7B6y7-RHjdRrZkJkPs1gmJ8YEk9LoTG5470Twxx0WMolEyaBMbcVJqDImqf-LwFVZuhSwEf1inGBzGbjF1_HYwY9sRxLe4ovYrZeeG6XtRJaX16_4YsTyZdvch9bUqw.jpg",
      "https://ik.imagekit.io/2upopbnzjh/imagenes%20de%20servicios/uq2huzRODP__62H7pQqf52563qle0pWF_7lts2bnSjqQ7nkVbd_L8eULqMUksElxt3YJi5AjTlQ_VhuKM30wb_SvW3RDh53vaHBre7fw_FuP07CS7PLDgtjQ7psm8bw8L0F3Td01JWN94NEVEQuvtH1S7gGjGyfKmKolZRmBVtXW2fAK6S5ZN3NJGcks0EgT.jpg?updatedAt=1782424594698",
    ],
    caracteristicas: [
      "Pantallas originales y de alta calidad",
      "Cambio rápido y profesional",
      "Garantía incluida",
      "Trabajamos con todas las marcas",
      "Presupuesto sin compromiso",
      "Calidad garantizada",
    ],
    pasos: [
      "Traé tu dispositivo con pantalla dañada",
      "Evaluamos el estado y tipo de pantalla",
      "Presupuestamos el cambio",
      "Reemplazamos la pantalla ",
      "Probamos touch y visualización",
      "Entregamos con garantía",
    ],
  },
  {
    id: 5,
    icono: <FaPlug />,
    titulo: "CAMBIO DE PIN DE CARGA",
    descripcionCorta: "Solucionamos problemas de carga y conexión.",
    color: "cyan",
    descripcionLarga:
      "Si tu celular no carga, carga lento o el puerto está suelto, solucionamos el problema. Reparamos y reemplazamos puertos de carga USB-C, Lightning y micro USB con repuestos de calidad.",
    imagenes: [
      "https://ik.imagekit.io/2upopbnzjh/imagenes%20de%20servicios/nFW-aDHMFaG14jH1hHJk2z6Uw02LJpEU0KWUyM5W657zKFRs6vXp3xhe5NO5F546DFxTrNcYWBXVqJz0sdZyWFmxfgPdWl-psRuJdl5Pzr4gn4KLQywuRzLQIDYMyrmOj-S5wzePes5LIW5ctCKJwPgc9tS2gSmy73TxGt7_2xAKtPWdzcpgA-65GMtOCNJy.jpg?updatedAt=1782424595472",
      "https://ik.imagekit.io/2upopbnzjh/imagenes%20de%20servicios/g5bc0yfUSluMIOBT9xK8dSS8cAMD-4dNs6V9_rH92rg9EvxKDuGk8e9DZ_qr8n9tdbgAgZ_Yg7uiBzsTPn7FH0_NtC_MzuXhpaac0HkNYXgc5FD-7xvWlrsRrI_JpBPFtpeLUQyTVU5mWfQa5bH8o5Rh_4509ubepn3R2ZKL6Nh1rM93TOdT4eccYkv3tJWU.jpg",
      "https://ik.imagekit.io/2upopbnzjh/imagenes%20de%20servicios/wYt0_GKoT2UqSOMUPtP2FzPJn-oDOUQbavs1w98F7FbkfCIgQFT2MIpeSUXU07aFw1UpsjbldAPSp5dkcVJOq_NfqK0Te3YSZV_YSkn4tzSx4pCiuardjcyR22AXskK1gziLh0_-avD6vrkFWrjNSzHdm9Lil2EmM_a9gIgK9-zd3fN_rC3UFjdZWaUJs-yD.jpg?updatedAt=1782424596485",
    ],
    caracteristicas: [
      "Reparación de puertos USB-C, Lightning y micro USB",
      "Carga rápida restaurada",
      "Repuestos de calidad",
      "Reparación rápida",
      "Garantía incluida",
      "Diagnóstico gratuito",
    ],
    pasos: [
      "Traé tu dispositivo con problemas de carga",
      "Diagnosticamos el estado del puerto",
      "Te informamos el costo y tiempo",
      "Reemplazamos el puerto dañado",
      "Verificamos la carga correcta",
      "Entregamos con garantía",
    ],
  },
  {
    id: 6,
    icono: <FaBatteryFull />,
    titulo: "CAMBIO DE BATERÍA",
    descripcionCorta: "Baterías originales y de alta calidad para tu dispositivo.",
    color: "blue",
    descripcionLarga:
      "¿Tu batería no dura nada o se hincho? Cambiamos la batería de tu celular o tablet con repuestos de calidad. Recuperá la autonomía original de tu dispositivo.",
    imagenes: [
      "https://ik.imagekit.io/2upopbnzjh/imagenes%20de%20servicios/KlDB39_yqaxuBM9NnWB_ZEjEEoxe5766uI4XH_e9JAbC4Lc3Gffe3vgxqpslo1xWlmviGGwg9wURwoy-Hacex_FxyRrOxclktKaI53CFZXODWUcevYto737wjDSFZadOoWp6HgMpboW_Sea6Ph1LLAMx9jPtPUj2G1sR7AjPBW97kpHQAxI3mTwID3Wj-Yfm.jpg?updatedAt=1782424597679",
      "https://ik.imagekit.io/2upopbnzjh/imagenes%20de%20servicios/yegWSIWeY2sx0KY3TffoQ5ggJ4aaoDRYdklO1vFmiQYD01Vmjo7WCu6D5076W_57Xbtt5NsWgC6lodFEoyS5ZeWtUxJtxqC56Svhle9T0Jfbs5oj-qD3942WJDxtDzJN7_RfugB9VLAYcVGnw6T2EiATwlLcBrNLnDAipacTyCx_SUUUEkMPIvS2N4BhmyZH.jpg?updatedAt=1782424596083",
      "https://ik.imagekit.io/2upopbnzjh/imagenes%20de%20servicios/7bQGzrj_csXtQiQz4i09xxzUfXh3at1yt28CuVX1LJZUIamxOcnss9eUP8zi1lNrpPV0bYUAKEO2v_YwKTYv9x-DTuoFnoV2hrTXCRQdrKhcgWrk8bUD2YM7MR5SDmZS-FV21mMGQcHfpwrnueia3XKCvsMJCRh82cdmMFams6KvnacbrzsLVGxU_tI0z5lR.jpg?updatedAt=1782424597285",
    ],
    caracteristicas: [
      "Baterías de capacidad",
      "Instalación profesional",
      "Garantía incluida",
      "Compatible con todas las marcas",
      "Rendimiento como nuevo",
      "Cambio rápido",
    ],
    pasos: [
      "Traé tu dispositivo con batería agotada",
      "Verificamos el modelo y compatibilidad",
      "Reemplazamos la batería",
      "Calibramos el sistema",
      "Entregamos con garantía",
    ],
  },
  {
    id: 7,
    icono: <FaShieldAlt />,
    titulo: "CAMBIO DE GLASS",
    descripcionCorta: "Reemplazamos el glass de tu celular cuando se rompe o astilla.",
    color: "purple",
    descripcionLarga:
      "¿Se te rompió el glass de la pantalla? Lo reemplazamos con repuestos de calidad. Trabajamos con todas las marcas y modelos, devolviéndole la protección y el aspecto original a tu dispositivo.",
    imagenes: [
      "https://ik.imagekit.io/2upopbnzjh/imagenes%20de%20servicios/UupJ94vuXpd8zY6rT2JXLsqqD3arx4d8bBJE8R8xuhQRSH3kHcpgli1l4KR1UDJdkwzzlodd4HPBXR6reaK-zrKgPTTOKL9IP7P-oDSG07HeicbmKFe1QoKInX_NuNg17Q2KSxWOPcA0aKs_78IgRxX4gnEUVYYb35cpZvumOXIUDtfID86MlOYFz-5bgxsV.jpg?updatedAt=1782424593600",
      "https://ik.imagekit.io/2upopbnzjh/imagenes%20de%20servicios/99udt-7CUQG6j8Fs-Kk87AVBB5X-uLh_r2d7Ao4sDpaKd-GKLNiqj2ZRJAlM4MisDh_faSTkXUNDnJjAJ7XuzvJpJ_8WIayP3NHdnQoBwP7KB9e7bdPjrM7SbOBAti4Q74fZZyNC-WrgxShRTBRnx4z8PrP69kA7ceBYfB9KtwIkqEjewHDvbFUAdBTdWUwI.jpg?updatedAt=1782424596074",
      "https://ik.imagekit.io/2upopbnzjh/imagenes%20de%20servicios/vhbAqLbeaFdmPQOG0wLvx0af3d5YnggPUQ8c17Ra0SB-r5Q_f7eLgLavqyLtWt-Alzd6uhV4mg561vppYLkqyYHEmy-mlAsnFZCVP0u9TXmk-c37VOCPkcT-AxAUkAnserAouVegQNa-_eU1lhnzL5jv5JnLsrcqu9yIduifpdxRVs750dJgIZe-p1jVOR6q.jpg?updatedAt=1782424598028",
    ],
    caracteristicas: [
      "Repuestos de alta calidad",
      "Compatible con todas las marcas",
      "Cambio rápido y profesional",
      "Garantía incluida",
      "Protección como nueva",
      "Presupuesto sin compromiso",
    ],
    pasos: [
      "Traé tu celular con el glass roto",
      "Evaluamos el estado y modelo",
      "Te informamos el costo y tiempo",
      "Reemplazamos el glass dañado",
      "Verificamos el resultado",
      "Entregamos con garantía",
    ],
  },
  {
    id: 8,
    icono: <FaGem />,
    titulo: "Y MUCHO MÁS",
    descripcionCorta: "Actualizaciones, formateos, respaldo de información y más servicios.",
    color: "pink",
    descripcionLarga:
      "Además de todos nuestros servicios especializados, ofrecemos una amplia gama de soluciones: actualizaciones de software, formateo profesional, respaldo y recuperación de información, configuración de redes y mucho más.",
    imagenes: [
      "https://images.openai.com/static-rsc-4/pkxgBpA8t6Z6KQK3vYvByu3q231Ww9J9vh17Feu9NQDmzhEqlDVquzvQr8oAvPQU2VHYcRubHFPYLptVE4Y6oiVqoijlRD3gVwiaK3Fjod801mY3RDVlZ7gNyXbkI8oh8kWM3PA9OiM4yxZLipTu8OfnPTZPK0gVF-yddZeRNvIMgs_HTm9wldXObJgQa6cQ?purpose=fullsize",
      "https://images.openai.com/static-rsc-4/ttu-DtZHG_bri9MEfAnMwuWYyWy6jJEW3V2ZqZaUCgfaGvEnEB5Kwag5VYbw1dDe4EjkqS9EMlx1bibNKi_yMGu9AdiRhYpt_k8ZzmL3c15Aq_Bg19d7KrjIFux1CaHYgXNHSPVJlrExBLREOWYo5JE761qKLg84_G7QM5wjGi5impqCwny0vSG_AgLfjJxc?purpose=fullsize",
      "https://images.openai.com/static-rsc-4/He58jxoB448dwuOTT_AaLrhT7ojGPhmWdQtNPEAQq1ySDtFflufXPLuc1PCuwKiwteeJVZHNY9Ly1hSrYsbl0W5XF8BYmUylRfn-otp9lAT4zom4kMHxWXBDeVbUhEbOOxY_-7TIpwRH9l-sim_ps0EEAe9boaOLvKqZHlgMWi4ia_zD9erNpO5DbTILHDQG?purpose=fullsize",
    ],
    caracteristicas: [
      "Actualizaciones de software",
      "Formateo profesional",
      "Respaldo de información",
      "Configuración de redes",
      "Mantenimiento preventivo",
      "Asesoramiento personalizado",
    ],
    pasos: [
      "Consultanos por tu necesidad",
      "Te asesoramos sobre la mejor solución",
      "Ejecutamos el servicio",
      "Verificamos el resultado",
      "Entregamos con garantía",
    ],
  },
];

export default function ServicioDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const servicio = serviciosData.find((s) => s.id === parseInt(id));

  if (!servicio) {
    return (
      <div className="sd-not-found">
        <h2>Servicio no encontrado</h2>
        <Link to="/nuestros-servicios" className="sd-back-btn">
          <FaArrowLeft /> Volver a servicios
        </Link>
      </div>
    );
  }

  const colorMap = {
    cyan: "#00d4ff",
    blue: "#668cff",
    purple: "#a855f7",
    pink: "#ec4899",
  };

  const accentColor = colorMap[servicio.color] || "#00d4ff";

  return (
    <div className="sd-page">
      <div className="sd-hero" style={{ "--accent": accentColor }}>
        <Link to="/nuestros-servicios" className="sd-back-link">
          <FaArrowLeft /> Volver a servicios
        </Link>

        <div className="sd-hero-content">
          <div className={`sd-icon sd-icon-${servicio.color}`}>
            {servicio.icono}
          </div>
          <h1 className="sd-title">{servicio.titulo}</h1>
          <p className="sd-subtitle">{servicio.descripcionCorta}</p>
        </div>
      </div>

      <div className="sd-gallery">
        <h2 className="sd-section-title">Galería del Servicio</h2>
        <div className="sd-gallery-grid">
          {servicio.imagenes.map((img, i) => (
            <div className="sd-gallery-item" key={i}>
              <img src={img} alt={`${servicio.titulo} ${i + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      </div>

      <div className="sd-description">
        <h2 className="sd-section-title">Descripción</h2>
        <p>{servicio.descripcionLarga}</p>
      </div>

      <div className="sd-features">
        <h2 className="sd-section-title">¿Qué incluye?</h2>
        <ul className="sd-features-list">
          {servicio.caracteristicas.map((feat, i) => (
            <li key={i}>
              <FaCheckCircle className="sd-check" style={{ color: accentColor }} />
              {feat}
            </li>
          ))}
        </ul>
      </div>

      <div className="sd-steps">
        <h2 className="sd-section-title">¿Cómo funciona?</h2>
        <div className="sd-steps-grid">
          {servicio.pasos.map((paso, i) => (
            <div className="sd-step" key={i} style={{ "--accent": accentColor }}>
              <span className="sd-step-num" style={{ background: accentColor }}>
                {i + 1}
              </span>
              <p>{paso}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="sd-cta" style={{ "--accent": accentColor }}>
        <h2>¿Te interesa este servicio?</h2>
        <p>Contactanos ahora y resolvemos tu consulta</p>
        <a
          href="https://wa.me/543816491380"
          target="_blank"
          rel="noreferrer"
          className="sd-whatsapp-btn"
        >
          <FaWhatsapp /> Chateá por WhatsApp
        </a>
        <button className="sd-back-btn" onClick={() => navigate("/nuestros-servicios")}>
          <FaArrowLeft /> Volver a servicios
        </button>
      </div>
    </div>
  );
}
