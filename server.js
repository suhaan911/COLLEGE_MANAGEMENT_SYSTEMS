const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Initialization (In-Memory SQLite)
const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to SQLite in-memory database.');
        createTables();
    }
});

// Create Tables matching your ER Diagram / Frontend Schemas
function createTables() {
    db.serialize(() => {
        // 1. Department
        db.run(`CREATE TABLE DEPARTMENT (department_id TEXT PRIMARY KEY, department_name TEXT NOT NULL)`);
        
        // 2. Student
        db.run(`CREATE TABLE STUDENT (student_id TEXT PRIMARY KEY, first_name TEXT, last_name TEXT, department_id TEXT, FOREIGN KEY (department_id) REFERENCES DEPARTMENT(department_id))`);
        
        // 3. Faculty
        db.run(`CREATE TABLE FACULTY (faculty_id TEXT PRIMARY KEY, designation TEXT, department_id TEXT, FOREIGN KEY (department_id) REFERENCES DEPARTMENT(department_id))`);
        
        // 4. Course
        db.run(`CREATE TABLE COURSE (course_id TEXT PRIMARY KEY, course_name TEXT, department_id TEXT, FOREIGN KEY (department_id) REFERENCES DEPARTMENT(department_id))`);
        
        // 5. Class
        db.run(`CREATE TABLE CLASS (class_id TEXT PRIMARY KEY, course_id TEXT, faculty_id TEXT, FOREIGN KEY (course_id) REFERENCES COURSE(course_id), FOREIGN KEY (faculty_id) REFERENCES FACULTY(faculty_id))`);
        
        // 6. Exam
        db.run(`CREATE TABLE EXAM (exam_id TEXT PRIMARY KEY, course_id TEXT, FOREIGN KEY (course_id) REFERENCES COURSE(course_id))`);
        
        // 7. Attendance
        db.run(`CREATE TABLE ATTENDANCE (attendance_id TEXT PRIMARY KEY, student_id TEXT, class_id TEXT, FOREIGN KEY (student_id) REFERENCES STUDENT(student_id), FOREIGN KEY (class_id) REFERENCES CLASS(class_id))`);
        
        // --- Dummy / Seed Data Insertions ---
        db.run(`INSERT INTO DEPARTMENT VALUES ('D1', 'Computer Science'), ('D2', 'Electrical Eng')`);
        db.run(`INSERT INTO STUDENT VALUES ('S101', 'Alice', 'Smith', 'D1'), ('S102', 'Bob', 'Jones', 'D2')`);
        db.run(`INSERT INTO FACULTY VALUES ('F501', 'Professor', 'D1'), ('F502', 'Assistant Prof', 'D2')`);
        db.run(`INSERT INTO COURSE VALUES ('C301', 'Web Dev', 'D1'), ('C302', 'Circuits', 'D2')`);
        db.run(`INSERT INTO CLASS VALUES ('CL801', 'C301', 'F501')`);
        db.run(`INSERT INTO EXAM VALUES ('EX901', 'C301')`);
        db.run(`INSERT INTO ATTENDANCE VALUES ('A001', 'S101', 'CL801'), ('A002', 'S102', 'CL801')`);
        
        console.log('All database tables created and seeded with initial values successfully.');
    });
}

// ----------------- UNIVERSAL CRUD API ENDPOINTS -----------------

// 1. READ API (Fetch all records from any table)
app.get('/api/:table', (req, res) => {
    const table = req.params.table.toUpperCase();
    
    // Safety check against dynamic table query injection
    const allowedTables = ['STUDENT', 'DEPARTMENT', 'FACULTY', 'COURSE', 'CLASS', 'EXAM', 'ATTENDANCE'];
    if (!allowedTables.includes(table)) {
        return res.status(400).json({ error: 'Invalid entity model table target.' });
    }

    db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. WRITE/UPDATE API (Processes both Save and Edit for all tables dynamically)
app.post('/api/:table', (req, res) => {
    const table = req.params.table.toUpperCase();
    const isEdit = req.body.isEdit;
    
    if (table === 'STUDENT') {
        const { student_id, first_name, last_name, department_id } = req.body;
        if (isEdit) {
            db.run(`UPDATE STUDENT SET first_name=?, last_name=?, department_id=? WHERE student_id=?`, [first_name, last_name, department_id, student_id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Student updated successfully!' });
            });
        } else {
            db.run(`INSERT INTO STUDENT VALUES (?, ?, ?, ?)`, [student_id, first_name, last_name, department_id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Student added successfully!' });
            });
        }
    } 
    else if (table === 'DEPARTMENT') {
        const { department_id, department_name } = req.body;
        if (isEdit) {
            db.run(`UPDATE DEPARTMENT SET department_name=? WHERE department_id=?`, [department_name, department_id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Department updated successfully!' });
            });
        } else {
            db.run(`INSERT INTO DEPARTMENT VALUES (?, ?)`, [department_id, department_name], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Department added successfully!' });
            });
        }
    }
    else if (table === 'FACULTY') {
        const { faculty_id, designation, department_id } = req.body;
        if (isEdit) {
            db.run(`UPDATE FACULTY SET designation=?, department_id=? WHERE faculty_id=?`, [designation, department_id, faculty_id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Faculty updated successfully!' });
            });
        } else {
            db.run(`INSERT INTO FACULTY VALUES (?, ?, ?)`, [faculty_id, designation, department_id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Faculty added successfully!' });
            });
        }
    }
    else if (table === 'COURSE') {
        const { course_id, course_name, department_id } = req.body;
        if (isEdit) {
            db.run(`UPDATE COURSE SET course_name=?, department_id=? WHERE course_id=?`, [course_name, department_id, course_id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Course updated successfully!' });
            });
        } else {
            db.run(`INSERT INTO COURSE VALUES (?, ?, ?)`, [course_id, course_name, department_id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Course added successfully!' });
            });
        }
    }
    else if (table === 'CLASS') {
        const { class_id, course_id, faculty_id } = req.body;
        if (isEdit) {
            db.run(`UPDATE CLASS SET course_id=?, faculty_id=? WHERE class_id=?`, [course_id, faculty_id, class_id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Class updated successfully!' });
            });
        } else {
            db.run(`INSERT INTO CLASS VALUES (?, ?, ?)`, [class_id, course_id, faculty_id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Class added successfully!' });
            });
        }
    }
    else if (table === 'EXAM') {
        const { exam_id, course_id } = req.body;
        if (isEdit) {
            db.run(`UPDATE EXAM SET course_id=? WHERE exam_id=?`, [course_id, exam_id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Exam updated successfully!' });
            });
        } else {
            db.run(`INSERT INTO EXAM VALUES (?, ?)`, [exam_id, course_id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Exam added successfully!' });
            });
        }
    }
    else if (table === 'ATTENDANCE') {
        const { attendance_id, student_id, class_id } = req.body;
        if (isEdit) {
            db.run(`UPDATE ATTENDANCE SET student_id=?, class_id=? WHERE attendance_id=?`, [student_id, class_id, attendance_id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Attendance updated successfully!' });
            });
        } else {
            db.run(`INSERT INTO ATTENDANCE VALUES (?, ?, ?)`, [attendance_id, student_id, class_id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Attendance registered successfully!' });
            });
        }
    } else {
        res.status(400).json({ error: 'Unknown data structure route target.' });
    }
});

// 3. DELETE API (Dynamic deletion for any primary key context)
app.delete('/api/:table/:idKey/:idValue', (req, res) => {
    const table = req.params.table.toUpperCase();
    const idKey = req.params.idKey;
    const idValue = req.params.idValue;

    // Direct structural query safe matching execution
    db.run(`DELETE FROM ${table} WHERE ${idKey} = ?`, [idValue], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `Record deleted successfully from ${table}!` });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server successfully started running at http://localhost:${PORT}`);
});