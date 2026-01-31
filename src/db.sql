CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    detalle TEXT NOT NULL,

    costo NUMERIC(12,2) NOT NULL,

    stock INTEGER DEFAULT 0,
    entradas INTEGER DEFAULT 0,
    ventas INTEGER DEFAULT 0
);



CREATE TABLE precios_producto (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER UNIQUE NOT NULL,

    -- PORCENTAJES (el usuario los pone)
    porc_contado NUMERIC(5,2) NOT NULL,
    porc_3_4 NUMERIC(5,2) NOT NULL,
    porc_6_7 NUMERIC(5,2) NOT NULL,
    porc_10 NUMERIC(5,2) NOT NULL,

    -- PRECIOS (calculados)
    precio_contado NUMERIC(12,2),
    precio_3_4 NUMERIC(12,2),
    precio_6_7 NUMERIC(12,2),
    precio_10 NUMERIC(12,2),

    -- UTILIDADES (calculadas)
    utilidad_contado NUMERIC(12,2),
    utilidad_3_4 NUMERIC(12,2),
    utilidad_6_7 NUMERIC(12,2),
    utilidad_10 NUMERIC(12,2),

    CONSTRAINT fk_producto
        FOREIGN KEY (producto_id)
        REFERENCES productos(id)
        ON DELETE CASCADE
);
