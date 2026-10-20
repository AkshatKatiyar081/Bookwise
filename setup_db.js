const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  const dbPath = path.join(__dirname, 'library.sqlite');
  console.log('Connecting to SQLite database at ' + dbPath + '...');

  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');

    console.log('Dropping existing tables...');
    await db.exec(`
      DROP TABLE IF EXISTS fines;
      DROP TABLE IF EXISTS reservations;
      DROP TABLE IF EXISTS borrow_records;
      DROP TABLE IF EXISTS admins;
      DROP TABLE IF EXISTS books;
      DROP TABLE IF EXISTS members;
    `);
    
    console.log('Creating tables...');

    await db.exec(`
      CREATE TABLE members (
        member_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        address TEXT,
        membership_date DATE DEFAULT CURRENT_DATE,
        membership_type TEXT DEFAULT 'student' CHECK(membership_type IN ('student', 'faculty')),
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
        password TEXT NOT NULL
      );

      CREATE TABLE books (
        book_id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        isbn TEXT NOT NULL UNIQUE,
        genre TEXT,
        publisher TEXT,
        published_year INTEGER,
        total_copies INTEGER DEFAULT 1,
        available_copies INTEGER DEFAULT 1,
        shelf_location TEXT,
        cover_image TEXT
      );

      CREATE TABLE admins (
        admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'librarian' CHECK(role IN ('admin', 'librarian'))
      );

      CREATE TABLE borrow_records (
        record_id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        borrow_date DATE DEFAULT CURRENT_DATE,
        due_date DATE NOT NULL,
        return_date DATE,
        status TEXT DEFAULT 'borrowed' CHECK(status IN ('borrowed', 'returned', 'overdue')),
        fine_amount REAL DEFAULT 0.00,
        FOREIGN KEY (book_id) REFERENCES books(book_id),
        FOREIGN KEY (member_id) REFERENCES members(member_id)
      );

      CREATE TABLE reservations (
        reservation_id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        reservation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'fulfilled', 'cancelled')),
        FOREIGN KEY (book_id) REFERENCES books(book_id),
        FOREIGN KEY (member_id) REFERENCES members(member_id)
      );

      CREATE TABLE fines (
        fine_id INTEGER PRIMARY KEY AUTOINCREMENT,
        record_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        paid INTEGER DEFAULT 0 CHECK(paid IN (0, 1)),
        fine_date DATE DEFAULT CURRENT_DATE,
        FOREIGN KEY (record_id) REFERENCES borrow_records(record_id),
        FOREIGN KEY (member_id) REFERENCES members(member_id)
      );
    `);

    console.log('All 6 tables created');

    console.log('Inserting seed data...');
    // Seed Admins
    const hash = await bcrypt.hash('admin123', 10);
    const hashMember = await bcrypt.hash('member123', 10);

    const insertAdmin = await db.prepare('INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, ?)');
    await insertAdmin.run(['Head Librarian', 'admin@library.com', hash, 'admin']);
    await insertAdmin.run(['Jane Librarian', 'jane@library.com', hash, 'librarian']);
    await insertAdmin.finalize();

    // Seed Books
    const insertBook = await db.prepare('INSERT INTO books (title, author, isbn, genre, publisher, published_year, total_copies, available_copies, shelf_location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    await insertBook.run(['To Kill a Mockingbird', 'Harper Lee', '978-0061120084', 'Fiction', 'Harper Perennial', 2006, 5, 3, 'A-101']);
    await insertBook.run(['1984', 'George Orwell', '978-0451524935', 'Dystopian', 'Signet Classic', 1961, 4, 2, 'A-102']);
    await insertBook.run(['Pride and Prejudice', 'Jane Austen', '978-0141439518', 'Romance', 'Penguin Classics', 2002, 3, 3, 'A-103']);
    await insertBook.run(['The Great Gatsby', 'F. Scott Fitzgerald', '978-0743273565', 'Fiction', 'Scribner', 2004, 4, 4, 'B-201']);
    await insertBook.run(['Moby Dick', 'Herman Melville', '978-0142437247', 'Adventure', 'Penguin Classics', 2003, 2, 1, 'B-202']);
    await insertBook.run(['War and Peace', 'Leo Tolstoy', '978-0143039990', 'Historical', 'Penguin Classics', 2007, 3, 3, 'B-203']);
    await insertBook.run(['The Catcher in the Rye', 'J.D. Salinger', '978-0316769488', 'Fiction', 'Little Brown', 1991, 5, 4, 'C-301']);
    await insertBook.run(['Brave New World', 'Aldous Huxley', '978-0060850524', 'Dystopian', 'Harper Perennial', 2006, 3, 2, 'C-302']);
    await insertBook.run(['The Hobbit', 'J.R.R. Tolkien', '978-0547928227', 'Fantasy', 'Mariner Books', 2012, 6, 5, 'C-303']);
    await insertBook.run(['Crime and Punishment', 'Fyodor Dostoevsky', '978-0486415871', 'Psychological', 'Dover Publications', 2001, 2, 2, 'D-401']);
    await insertBook.finalize();

    // Seed Members
    const insertMember = await db.prepare('INSERT INTO members (name, email, phone, address, membership_type, password) VALUES (?, ?, ?, ?, ?, ?)');
    await insertMember.run(['Arjun Sharma', 'arjun@college.edu', '9876543210', '12 College Road, Delhi', 'student', hashMember]);
    await insertMember.run(['Priya Patel', 'priya@college.edu', '9876543211', '45 University Ave, Mumbai', 'student', hashMember]);
    await insertMember.run(['Dr. Meena Iyer', 'meena@college.edu', '9876543212', '78 Faculty Block, Bangalore', 'faculty', hashMember]);
    await insertMember.run(['Rahul Verma', 'rahul@college.edu', '9876543213', '23 Hostel Wing B, Chennai', 'student', hashMember]);
    await insertMember.run(['Sneha Gupta', 'sneha@college.edu', '9876543214', '56 PG Block, Hyderabad', 'student', hashMember]);
    await insertMember.finalize();

    // Seed Borrow Records
    const insertBorrow = await db.prepare('INSERT INTO borrow_records (book_id, member_id, borrow_date, due_date, status, return_date) VALUES (?, ?, ?, ?, ?, ?)');
    await insertBorrow.run([1, 1, '2026-03-01', '2026-03-15', 'borrowed', null]);
    await insertBorrow.run([2, 2, '2026-03-05', '2026-03-19', 'borrowed', null]);
    await insertBorrow.run([5, 1, '2026-02-20', '2026-03-06', 'overdue', null]);
    await insertBorrow.run([7, 3, '2026-03-10', '2026-03-24', 'borrowed', null]);
    await insertBorrow.run([9, 4, '2026-02-25', '2026-03-11', 'returned', '2026-03-10']);
    await insertBorrow.finalize();

    // Seed Fine
    await db.run('INSERT INTO fines (record_id, member_id, amount, paid) VALUES (?, ?, ?, ?)', [3, 1, 32.00, 0]);

    console.log('Seed data inserted');
    console.log('\nSQLite database setup complete! Run: npm start\n');
    await db.close();

  } catch (err) {
    console.error('Error:', err);
  }
}

setupDatabase();
