/* =====================================================
   DATABASE CREATION
   ===================================================== */

DROP DATABASE IF EXISTS faculty_performance_db;
CREATE DATABASE faculty_performance_db;
USE faculty_performance_db;

/* =====================================================
   USERS & FACULTY
   ===================================================== */

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('FACULTY','ADMIN') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE faculty (
    faculty_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    faculty_name VARCHAR(100) NOT NULL,
    designation VARCHAR(50),
    department VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE SET NULL
);

/* =====================================================
   FACULTY QUALIFICATIONS (NO VERIFICATION)
   ===================================================== */

CREATE TABLE faculty_qualifications (
    qualification_id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    qualification_type ENUM('MASTERS','PHD','POSTDOC') NOT NULL,
    degree_name VARCHAR(100),
    specialization VARCHAR(100),
    institute VARCHAR(255),
    year_of_completion YEAR,
    proof_path VARCHAR(255),

    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id)
        ON DELETE CASCADE
);

/* =====================================================
   LOOKUP TABLES
   ===================================================== */

CREATE TABLE publication_indexing (
    indexing_id INT AUTO_INCREMENT PRIMARY KEY,
    indexing_name VARCHAR(50) UNIQUE NOT NULL
);

/* =====================================================
   JOURNAL PUBLICATIONS
   ===================================================== */

CREATE TABLE journal_publications (
    journal_id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    journal_name VARCHAR(255),
    author_position INT,
    volume VARCHAR(50),
    publication_date DATE,
    paper_link VARCHAR(2083),
    indexing_id INT,
    proof_path VARCHAR(255),

    status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    approved_by INT,
    approved_at TIMESTAMP,
    remarks VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
    FOREIGN KEY (indexing_id) REFERENCES publication_indexing(indexing_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

/* =====================================================
   CONFERENCE PUBLICATIONS
   ===================================================== */

CREATE TABLE conference_publications (
    conference_id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    title VARCHAR(255),
    conference_name VARCHAR(255),
    author_position INT,
    conference_date DATE,
    proceedings_details VARCHAR(100),
    conference_link VARCHAR(2083),
    indexing_id INT,
    proof_path VARCHAR(255),

    status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    approved_by INT,
    approved_at TIMESTAMP,
    remarks VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
    FOREIGN KEY (indexing_id) REFERENCES publication_indexing(indexing_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

/* =====================================================
   BOOKS & BOOK CHAPTERS
   ===================================================== */

CREATE TABLE books (
    book_id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    book_title VARCHAR(255) NOT NULL,
    publisher VARCHAR(255),
    isbn VARCHAR(20),
    publication_year YEAR,
    proof_path VARCHAR(255),

    status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    approved_by INT,
    approved_at TIMESTAMP,
    remarks VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

CREATE TABLE book_chapters (
    chapter_id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    book_id INT NOT NULL,
    chapter_title VARCHAR(255),
    chapter_number INT,
    publisher VARCHAR(255),
    publication_year YEAR,
    proof_path VARCHAR(255),

    status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    approved_by INT,
    approved_at TIMESTAMP,
    remarks VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
    FOREIGN KEY (book_id) REFERENCES books(book_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

/* =====================================================
   PATENTS
   ===================================================== */

CREATE TABLE patents (
    patent_id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    patent_title VARCHAR(255) NOT NULL,
    application_no VARCHAR(50) UNIQUE NOT NULL,
    patent_status ENUM('FILED','PUBLISHED','GRANTED'),
    filed_date DATE,
    published_date DATE,
    granted_date DATE,
    publish_proof_path VARCHAR(255),
    grant_proof_path VARCHAR(255),

    status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    approved_by INT,
    approved_at TIMESTAMP,
    remarks VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

/* =====================================================
   RESEARCH FUNDING
   ===================================================== */

CREATE TABLE research_funding (
    funding_id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    funding_agency VARCHAR(255),
    project_title VARCHAR(255),
    amount DECIMAL(15,2),
    start_date DATE,
    end_date DATE,
    proof_path VARCHAR(255),

    status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    approved_by INT,
    approved_at TIMESTAMP,
    remarks VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

/* =====================================================
   CONSULTANCY
   ===================================================== */

CREATE TABLE consultancy (
    consultancy_id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    company VARCHAR(255),
    consultancy_type VARCHAR(50),
    problem_statement VARCHAR(1000),
    amount DECIMAL(15,2),
    start_date DATE,
    end_date DATE,
    proof_path VARCHAR(255),

    status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    approved_by INT,
    approved_at TIMESTAMP,
    remarks VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

/* =====================================================
   AWARDS
   ===================================================== */

CREATE TABLE awards (
    award_id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    award_name VARCHAR(255),
    awarding_body VARCHAR(255),
    award_date DATE,
    venue VARCHAR(255),
    proof_path VARCHAR(255),

    status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    approved_by INT,
    approved_at TIMESTAMP,
    remarks VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

/* =====================================================
   ACADEMIC SERVICE (FDP, GUEST LECTURE, JUDGE, ETC.)
   ===================================================== */

CREATE TABLE academic_service (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    service_type ENUM(
        'FDP',
        'GUEST_LECTURE',
        'JUDGE',
        'CHAIRPERSON',
        'RESOURCE_PERSON'
    ),
    institution VARCHAR(255),
    topic VARCHAR(255),
    role_description VARCHAR(255),
    start_date DATE,
    end_date DATE,
    proof_path VARCHAR(255),

    status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    approved_by INT,
    approved_at TIMESTAMP,
    remarks VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

/* =====================================================
   SCORING RULES (OPTIONAL / CONFIG)
   ===================================================== */

CREATE TABLE scoring_rules (
    rule_id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50),
    condition_value VARCHAR(50),
    score INT
);
