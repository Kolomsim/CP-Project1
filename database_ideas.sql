-- Пользователи
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    login VARCHAR(100) UNIQUE NOT NULL,
    citizenship VARCHAR(50),
    marital_status VARCHAR(20) CHECK (marital_status IN ('холост','женат/замужем')),
    purchase_method VARCHAR(20) CHECK (purchase_method IN ('немедленно','ипотека','кредит')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Платформы
CREATE TABLE platforms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Продавцы
CREATE TABLE sellers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    phone VARCHAR(20),
    inn VARCHAR(12),
    platform_id INT REFERENCES platforms(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Недвижимость
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    cian_property_number BIGINT NOT NULL UNIQUE, -- ID объекта в url
    platform_id INT REFERENCES platforms(id) ON DELETE SET NULL,
    url TEXT UNIQUE,
    title VARCHAR(255),
    address VARCHAR(500),
    price BIGINT NOT NULL,
    total_area DECIMAL(8,2) NOT NULL,
    living_area DECIMAL(8,2),
    kitchen_area DECIMAL(8,2),
    floor INT,
    total_floors INT,
    rooms INT,
    property_type VARCHAR(30),
    deal_type VARCHAR(20) DEFAULT 'sale',
    status VARCHAR(20) DEFAULT 'active',
    seller_id INT REFERENCES sellers(id) ON DELETE SET NULL,
    lat DECIMAL(9,6),
    lon DECIMAL(9,6),
    description TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Избранное
CREATE TABLE favourites (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    property_id INT REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, property_id) -- составной ключ
);

-- Статьи
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(100),
    category VARCHAR(50),
    views INT DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- История проверок
CREATE TABLE checks (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    property_id INT REFERENCES properties(id) ON DELETE CASCADE,
    overall_status VARCHAR(20),
    full_report JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX idx_properties_cian_number ON properties(cian_property_number);
CREATE INDEX idx_properties_platform_id ON properties(platform_id);
CREATE INDEX idx_properties_seller_id ON properties(seller_id);
CREATE INDEX idx_checks_user_id ON checks(user_id);
CREATE INDEX idx_checks_property_id ON checks(property_id);
CREATE INDEX idx_favourites_user_id ON favourites(user_id);
CREATE INDEX idx_favourites_property_id ON favourites(property_id);