export const TIPO_SERVICIO_OPTIONS = [
    { value: "reparacion", label: "Reparación" },
    { value: "mantenimiento", label: "Mantenimiento" },
    { value: "instalacion", label: "Instalación" },
    { value: "otro", label: "Otro" },
];

export const TIPO_EQUIPO_OPTIONS = [
    { value: "celulares", label: "Celulares" },
    { value: "computadora", label: "Computadora" },
    { value: "parlantes", label: "Parlantes" },
    { value: "otros", label: "Otros" },
];

export const BRAND_OPTIONS = {
    celulares: ["Samsung", "Apple", "Xiaomi", "Motorola", "Huawei", "Otro"],
    computadora: ["HP", "Dell", "Lenovo", "Asus", "Acer", "Otro"],
    parlantes: ["JBL", "Bose", "Sony", "Philips", "Otro"],
    otros: []
};

export const MODEL_OPTIONS = {
    celulares: ["Galaxy S22", "iPhone 13", "Redmi Note 11", "Moto G Power", "Otro"],
    computadora: ["Pavilion", "Inspiron", "ThinkPad", "ZenBook", "Aspire", "Otro"],
    parlantes: ["Flip", "Charge", "SoundLink", "SRS-XB", "Otro"],
    otros: []
};

export const ESTADO_OPTIONS = [
    { value: "pendiente", label: "Pendiente" },
    { value: "enRevision", label: "En Revisión" },
    { value: "revisionTerminada", label: "En Reparación" },
    { value: "terminado", label: "Listo para Entrega" },
    { value: "notificacion", label: "Notificación" },
    { value: "entregado", label: "Entregado" },
];

export const METODO_PAGO_OPTIONS = [
    { value: "efectivo", label: "Efectivo" },
    { value: "transferencia", label: "Transferencia" },
    { value: "tarjeta", label: "Tarjeta" },
    { value: "mercadopago", label: "Mercado Pago" },
    { value: "otro", label: "Otro" },
];

export const getEstadoLabel = (value) => {
    return ESTADO_OPTIONS.find(o => o.value === value)?.label || value;
};