-- ============================================
-- Library Management System — SQL Server Schema
-- ============================================

-- Create Database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'library_db')
BEGIN
    CREATE DATABASE library_db;
END
GO

USE library_db;
GO

-- ============================================
-- Drop existing tables (in correct order)
-- ============================================
IF OBJECT_ID('fines', 'U') IS NOT NULL DROP TABLE fines;
IF OBJECT_ID('reservations', 'U') IS NOT NULL DROP TABLE reservations;
IF OBJECT_ID('borrow_records', 'U') IS NOT NULL DROP TABLE borrow_records;
IF OBJECT_ID('admins', 'U') IS NOT NULL DROP TABLE admins;
IF OBJECT_ID('books', 'U') IS NOT NULL DROP TABLE books;
IF OBJECT_ID('members', 'U') IS NOT NULL DROP TABLE members;
GO

-- ============================================
-- Members (Students/Users)
-- ============================================
CREATE TABLE members (
  member_id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(100) NOT NULL,
  email NVARCHAR(100) NOT NULL UNIQUE,
  phone NVARCHAR(15),
  address NVARCHAR(MAX),
  membership_date DATE DEFAULT CAST(GETDATE() AS DATE),
  membership_type NVARCHAR(20) DEFAULT 'student' CHECK (membership_type IN ('student', 'faculty')),
  status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  password NVARCHAR(255) NOT NULL
);
GO

-- ============================================
-- Books
-- ============================================
CREATE TABLE books (
  book_id INT IDENTITY(1,1) PRIMARY KEY,
  title NVARCHAR(200) NOT NULL,
  author NVARCHAR(150) NOT NULL,
  isbn NVARCHAR(20) NOT NULL UNIQUE,
  genre NVARCHAR(100),
  publisher NVARCHAR(150),
  published_year INT,
  total_copies INT DEFAULT 1,
  available_copies INT DEFAULT 1,
  shelf_location NVARCHAR(50),
  cover_image NVARCHAR(255)
);
GO

-- ============================================
-- Admin/Librarian
-- ============================================
CREATE TABLE admins (
  admin_id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(100) NOT NULL,
  email NVARCHAR(100) NOT NULL UNIQUE,
  password NVARCHAR(255) NOT NULL,
  role NVARCHAR(20) DEFAULT 'librarian' CHECK (role IN ('admin', 'librarian'))
);
GO

-- ============================================
-- Borrow Records
-- ============================================
CREATE TABLE borrow_records (
  record_id INT IDENTITY(1,1) PRIMARY KEY,
  book_id INT NOT NULL,
  member_id INT NOT NULL,
  borrow_date DATE DEFAULT CAST(GETDATE() AS DATE),
  due_date DATE NOT NULL,
  return_date DATE,
  status NVARCHAR(20) DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue')),
  fine_amount DECIMAL(8,2) DEFAULT 0.00,
  FOREIGN KEY (book_id) REFERENCES books(book_id),
  FOREIGN KEY (member_id) REFERENCES members(member_id)
);
GO

-- ============================================
-- Book Reservations
-- ============================================
CREATE TABLE reservations (
  reservation_id INT IDENTITY(1,1) PRIMARY KEY,
  book_id INT NOT NULL,
  member_id INT NOT NULL,
  reservation_date DATETIME DEFAULT GETDATE(),
  status NVARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  FOREIGN KEY (book_id) REFERENCES books(book_id),
  FOREIGN KEY (member_id) REFERENCES members(member_id)
);
GO

-- ============================================
-- Fines
-- ============================================
CREATE TABLE fines (
  fine_id INT IDENTITY(1,1) PRIMARY KEY,
  record_id INT NOT NULL,
  member_id INT NOT NULL,
  amount DECIMAL(8,2) NOT NULL,
  paid BIT DEFAULT 0,
  fine_date DATE DEFAULT CAST(GETDATE() AS DATE),
  FOREIGN KEY (record_id) REFERENCES borrow_records(record_id),
  FOREIGN KEY (member_id) REFERENCES members(member_id)
);
GO

-- ============================================
-- Seed Data
-- ============================================

-- Admin (password: admin123 — bcrypt hash)
INSERT INTO admins (name, email, password, role) VALUES
('Head Librarian', 'admin@library.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Jane Librarian', 'jane@library.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'librarian');
GO

-- Sample Books
INSERT INTO books (title, author, isbn, genre, publisher, published_year, total_copies, available_copies, shelf_location) VALUES
('To Kill a Mockingbird', 'Harper Lee', '978-0061120084', 'Fiction', 'Harper Perennial', 2006, 5, 3, 'A-101'),
('1984', 'George Orwell', '978-0451524935', 'Dystopian', 'Signet Classic', 1961, 4, 2, 'A-102'),
('Pride and Prejudice', 'Jane Austen', '978-0141439518', 'Romance', 'Penguin Classics', 2002, 3, 3, 'A-103'),
('The Great Gatsby', 'F. Scott Fitzgerald', '978-0743273565', 'Fiction', 'Scribner', 2004, 4, 4, 'B-201'),
('Moby Dick', 'Herman Melville', '978-0142437247', 'Adventure', 'Penguin Classics', 2003, 2, 1, 'B-202'),
('War and Peace', 'Leo Tolstoy', '978-0143039990', 'Historical', 'Penguin Classics', 2007, 3, 3, 'B-203'),
('The Catcher in the Rye', 'J.D. Salinger', '978-0316769488', 'Fiction', 'Little Brown', 1991, 5, 4, 'C-301'),
('Brave New World', 'Aldous Huxley', '978-0060850524', 'Dystopian', 'Harper Perennial', 2006, 3, 2, 'C-302'),
('The Hobbit', 'J.R.R. Tolkien', '978-0547928227', 'Fantasy', 'Mariner Books', 2012, 6, 5, 'C-303'),
('Crime and Punishment', 'Fyodor Dostoevsky', '978-0486415871', 'Psychological', 'Dover Publications', 2001, 2, 2, 'D-401');
GO

-- Sample Members (password: member123 — bcrypt hash)
INSERT INTO members (name, email, phone, address, membership_type, password) VALUES
('Arjun Sharma', 'arjun@college.edu', '9876543210', '12 College Road, Delhi', 'student', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Priya Patel', 'priya@college.edu', '9876543211', '45 University Ave, Mumbai', 'student', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Dr. Meena Iyer', 'meena@college.edu', '9876543212', '78 Faculty Block, Bangalore', 'faculty', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Rahul Verma', 'rahul@college.edu', '9876543213', '23 Hostel Wing B, Chennai', 'student', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Sneha Gupta', 'sneha@college.edu', '9876543214', '56 PG Block, Hyderabad', 'student', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
GO

-- Sample Borrow Records
INSERT INTO borrow_records (book_id, member_id, borrow_date, due_date, status) VALUES
(1, 1, '2026-03-01', '2026-03-15', 'borrowed'),
(2, 2, '2026-03-05', '2026-03-19', 'borrowed'),
(5, 1, '2026-02-20', '2026-03-06', 'overdue'),
(7, 3, '2026-03-10', '2026-03-24', 'borrowed'),
(9, 4, '2026-02-25', '2026-03-11', 'returned');
GO

UPDATE borrow_records SET return_date = '2026-03-10' WHERE record_id = 5;
GO

-- Sample Fine
INSERT INTO fines (record_id, member_id, amount, paid) VALUES
(3, 1, 32.00, 0);
GO
