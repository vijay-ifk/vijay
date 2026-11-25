import express from 'express';
import cors from 'cors';
import compression from 'compression';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const app = express();
const port = Number(process.env.PORT || 3001);
const dataDir = path.resolve('data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, 'learnai.db'));

db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('student','faculty','admin')) NOT NULL,
    active INTEGER DEFAULT 1,
    avatar TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS departments (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS courses (id INTEGER PRIMARY KEY, name TEXT NOT NULL, department_id INTEGER, FOREIGN KEY(department_id) REFERENCES departments(id));
  CREATE TABLE IF NOT EXISTS semesters (id INTEGER PRIMARY KEY, number INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS sections (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS subjects (id INTEGER PRIMARY KEY, name TEXT NOT NULL, code TEXT UNIQUE, course_id INTEGER, FOREIGN KEY(course_id) REFERENCES courses(id));
  CREATE TABLE IF NOT EXISTS student_profiles (
    id INTEGER PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    usn TEXT UNIQUE NOT NULL,
    department_id INTEGER,
    course_id INTEGER,
    semester_id INTEGER,
    section_id INTEGER,
    cgpa REAL,
    sgpa REAL,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(department_id) REFERENCES departments(id),
    FOREIGN KEY(course_id) REFERENCES courses(id),
    FOREIGN KEY(semester_id) REFERENCES semesters(id),
    FOREIGN KEY(section_id) REFERENCES sections(id)
  );
  CREATE TABLE IF NOT EXISTS faculty_profiles (
    id INTEGER PRIMARY KEY, user_id INTEGER UNIQUE NOT NULL,
    employee_id TEXT UNIQUE NOT NULL, department_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(department_id) REFERENCES departments(id)
  );
  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL, subject_id INTEGER NOT NULL,
    status TEXT CHECK(status IN ('present','absent')) NOT NULL, date TEXT NOT NULL,
    FOREIGN KEY(student_id) REFERENCES student_profiles(id),
    FOREIGN KEY(subject_id) REFERENCES subjects(id)
  );
  CREATE TABLE IF NOT EXISTS marks (
    id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL, subject_id INTEGER NOT NULL,
    type TEXT NOT NULL, obtained REAL NOT NULL, maximum REAL NOT NULL,
    FOREIGN KEY(student_id) REFERENCES student_profiles(id),
    FOREIGN KEY(subject_id) REFERENCES subjects(id)
  );
  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY, title TEXT NOT NULL, description TEXT,
    subject_id INTEGER NOT NULL, faculty_id INTEGER,
    due_date TEXT NOT NULL, attachment TEXT,
    FOREIGN KEY(subject_id) REFERENCES subjects(id),
    FOREIGN KEY(faculty_id) REFERENCES faculty_profiles(id)
  );
  CREATE TABLE IF NOT EXISTS assignment_submissions (
    id INTEGER PRIMARY KEY, assignment_id INTEGER NOT NULL, student_id INTEGER NOT NULL,
    file_name TEXT, status TEXT DEFAULT 'pending', score REAL, feedback TEXT,
    submitted_at TEXT,
    FOREIGN KEY(assignment_id) REFERENCES assignments(id),
    FOREIGN KEY(student_id) REFERENCES student_profiles(id)
  );
  CREATE TABLE IF NOT EXISTS examinations (
    id INTEGER PRIMARY KEY, subject_id INTEGER NOT NULL, title TEXT NOT NULL,
    exam_date TEXT NOT NULL, syllabus TEXT,
    FOREIGN KEY(subject_id) REFERENCES subjects(id)
  );
  CREATE TABLE IF NOT EXISTS study_tasks (
    id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL,     title TEXT NOT NULL,
    subject TEXT, due_date TEXT, priority TEXT DEFAULT 'medium',
    completed INTEGER DEFAULT 0,
    FOREIGN KEY(student_id) REFERENCES student_profiles(id)
  );
  CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY, title TEXT NOT NULL, subject_id INTEGER,
    file_name TEXT NOT NULL, file_url TEXT, kind TEXT,
    FOREIGN KEY(subject_id) REFERENCES subjects(id)
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, title TEXT NOT NULL,
    body TEXT, category TEXT, read INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, title TEXT NOT NULL,
    messages TEXT NOT NULL DEFAULT '[]', updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}
function verifyPassword(password, stored) {
  const [salt, key] = stored.split(':');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), crypto.scryptSync(password, salt, 64));
}

const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
if (!userCount) {
  const adminHash = hashPassword('Admin@123');
  const facultyHash = hashPassword('Faculty@123');
  const studentHash = hashPassword('Student@123');
  db.prepare(`INSERT INTO users(name,email,password_hash,role,avatar) VALUES (?,?,?,?,?)`)
    .run('Aarav Mehta', 'student@learnai.demo', studentHash, 'student', 'AM');
  db.prepare(`INSERT INTO users(name,email,password_hash,role,avatar) VALUES (?,?,?,?,?)`)
    .run('Dr. Priya Sharma', 'faculty@learnai.demo', facultyHash, 'faculty', 'PS');
  db.prepare(`INSERT INTO users(name,email,password_hash,role,avatar) VALUES (?,?,?,?,?)`)
    .run('System Administrator', 'admin@learnai.demo', adminHash, 'admin', 'SA');
  db.prepare(`INSERT INTO departments(name) VALUES ('Computer Science')`).run();
  db.prepare(`INSERT INTO departments(name) VALUES ('Information Technology')`).run();
  db.prepare(`INSERT INTO courses(name,department_id) VALUES ('B.Tech Computer Science',1)`).run();
  db.prepare(`INSERT INTO semesters(number) VALUES (1),(2),(3),(4),(5),(6),(7),(8)`).run();
  db.prepare(`INSERT INTO sections(name) VALUES ('A'),('B')`).run();
  const subjectRows = [
    ['Data Structures','CS301'], ['Database Management','CS302'], ['Operating Systems','CS303'],
    ['Machine Learning','CS304'], ['Computer Networks','CS305']
  ];
  const subjectInsert = db.prepare(`INSERT INTO subjects(name,code,course_id) VALUES (?,?,1)`);
  subjectRows.forEach(r => subjectInsert.run(r[0], r[1]));
  db.prepare(`INSERT INTO student_profiles(user_id,usn,department_id,course_id,semester_id,section_id,cgpa,sgpa)
    VALUES (1,'1CS23CS001',1,1,5,1,8.2,8.4)`).run();
  db.prepare(`INSERT INTO faculty_profiles(user_id,employee_id,department_id) VALUES (2,'FAC001',1)`).run();
  const attendanceInsert = db.prepare(`INSERT INTO attendance(student_id,subject_id,status,date) VALUES (1,?,?,?)`);
  subjectRows.forEach((_, i) => {
    for (let n = 0; n < 20; n++) attendanceInsert.run(i + 1, n < (i === 0 ? 11 : i === 2 ? 13 : 16) ? 'present' : 'absent', `2026-11-${String(n + 1).padStart(2,'0')}`);
  });
  const markInsert = db.prepare(`INSERT INTO marks(student_id,subject_id,type,obtained,maximum) VALUES (1,?,?,?,?)`);
  const marks = [[1,'Internal',45,100],[2,'Internal',82,100],[3,'Internal',58,100],[4,'Internal',76,100],[5,'Internal',71,100]];
  marks.forEach(m => markInsert.run(m[0], m[1], m[2], m[3]));
  db.prepare(`INSERT INTO assignments(title,description,subject_id,faculty_id,due_date) VALUES
    ('Binary Search Trees','Implement and explain AVL rotations.',1,1,'2026-12-02'),
    ('SQL Normalization','Submit answers and an ER diagram.',2,1,'2026-12-06'),
    ('Process Scheduling','Compare FCFS, SJF, and Round Robin.',3,1,'2026-12-10')`).run();
  db.prepare(`INSERT INTO assignment_submissions(assignment_id,student_id,status) VALUES (1,1,'submitted'),(2,1,'pending'),(3,1,'pending')`).run();
  db.prepare(`INSERT INTO examinations(subject_id,title,exam_date,syllabus) VALUES
    (1,'Data Structures Semester Exam','2026-12-15','Trees, graphs, hash tables'),
    (2,'DBMS Semester Exam','2026-12-18','SQL, normalization, transactions'),
    (3,'Operating Systems Semester Exam','2026-12-21','Processes, scheduling, memory')`).run();
  db.prepare(`INSERT INTO study_tasks(student_id,title,subject,due_date,priority,completed) VALUES
    (1,'Practice AVL rotations','Data Structures','2026-11-26','high',0),
    (1,'Revise process scheduling','Operating Systems','2026-11-28','high',0),
    (1,'Complete SQL joins worksheet','DBMS','2026-11-30','medium',1)`).run();
  db.prepare(`INSERT INTO notifications(user_id,title,body,category) VALUES
    (1,'Data Structures assignment','Your assignment is due on December 2.','assignment'),
    (1,'Low attendance alert','Review your attendance with the faculty.','attendance'),
    (1,'AI learning recommendation','Data Structures is a suggested focus area.','recommendation')`).run();
  db.prepare(`INSERT INTO conversations(user_id,title,messages) VALUES (1,'Data Structures help','[]')`).run();
  db.prepare(`INSERT INTO resources(title,subject_id,file_name,kind) VALUES
    ('Data Structures Lecture Notes',1,'dsa-notes.pdf','PDF'),
    ('DBMS SQL Reference',2,'sql-reference.pdf','PDF'),
    ('Operating Systems Slides',3,'os-slides.ppt','PPT')`).run();
}

const sessions = new Map();
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '2mb' }));

function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const session = token && sessions.get(token);
  if (!session) return res.status(401).json({ error: 'Authentication required' });
  const user = db.prepare(`SELECT id,name,email,role,active,avatar FROM users WHERE id=?`).get(session.userId);
  if (!user || !user.active) return res.status(401).json({ error: 'Account is inactive or unavailable' });
  req.user = user;
  next();
}
function requireRole(...roles) {
  return (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Forbidden' });
}

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare(`SELECT * FROM users WHERE email=?`).get(email);
  if (!user || !user.active || !verifyPassword(password, user.password_hash)) return res.status(401).json({ error: 'Invalid email or password' });
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId: user.id });
  res.json({ token, user: { id:user.id,name:user.name,email:user.email,role:user.role,avatar:user.avatar } });
});
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, usn, departmentId, courseId } = req.body;
  if (!name || !email || !password || password.length < 8 || !usn) return res.status(400).json({ error: 'Name, email, USN and an 8-character password are required' });
  if (db.prepare(`SELECT id FROM users WHERE email=?`).get(email) || db.prepare(`SELECT id FROM student_profiles WHERE usn=?`).get(usn)) return res.status(409).json({ error: 'Email or USN already exists' });
  const role = 'student';
  const result = db.prepare(`INSERT INTO users(name,email,password_hash,role,avatar) VALUES (?,?,?,?,?)`).run(name,email,hashPassword(password),role,name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpper());
  const userId = Number(result.lastInsertRowid);
  db.prepare(`INSERT INTO student_profiles(user_id,usn,department_id,course_id,semester_id,section_id,cgpa,sgpa)
    VALUES (?,?,?,?,1,1,NULL,NULL)`).run(userId,usn,departmentId || 1,courseId || 1);
  res.status(201).json({ message: 'Student account created. Please sign in.' });
});
app.post('/api/auth/logout', auth, (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  sessions.delete(token);
  res.json({ ok:true });
});
app.get('/api/me', auth, (req, res) => res.json({ user:req.user }));

app.get('/api/student/dashboard', auth, requireRole('student'), (req, res) => {
  const profile = db.prepare(`SELECT sp.*,d.name department,c.name course,s.number semester,sec.name section
    FROM student_profiles sp LEFT JOIN departments d ON d.id=sp.department_id
    LEFT JOIN courses c ON c.id=sp.course_id LEFT JOIN semesters s ON s.id=sp.semester_id
    LEFT JOIN sections sec ON sec.id=sp.section_id WHERE sp.user_id=?`).get(req.user.id);
  if (!profile) return res.json({ profile:null, cards:{}, performance:[], attendance:[] });
  const marks = db.prepare(`SELECT m.type,m.obtained,m.maximum,sub.name subject FROM marks m JOIN subjects sub ON sub.id=m.subject_id WHERE m.student_id=?`).all(profile.id);
  const attendanceRows = db.prepare(`SELECT sub.name subject,
    COUNT(*) total, SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) present
    FROM attendance a JOIN subjects sub ON sub.id=a.subject_id WHERE a.student_id=? GROUP BY sub.id,sub.name`).all(profile.id);
  const attendance = attendanceRows.map(r => ({...r, percentage:r.total ? Math.round(r.present/r.total*100) : 0}));
  const overallAttendance = attendance.length ? Math.round(attendance.reduce((s,r)=>s+r.present,0)/attendance.reduce((s,r)=>s+r.total,0)*100) : 0;
  const avgMarks = marks.length ? Math.round(marks.reduce((s,m)=>s+m.obtained/m.maximum*100,0)/marks.length) : null;
  const pendingAssignments = db.prepare(`SELECT COUNT(*) n FROM assignments a LEFT JOIN assignment_submissions s ON s.assignment_id=a.id AND s.student_id=? WHERE s.id IS NULL OR s.status='pending'`).get(profile.id).n;
  const exams = db.prepare(`SELECT COUNT(*) n FROM examinations WHERE exam_date >= date('now')`).get().n;
  res.json({
    profile,
    cards:{attendance:overallAttendance,cgpa:profile.cgpa,sgpa:profile.sgpa,avgMarks,pendingAssignments,upcomingExams:exams},
    performance: marks.map(m=>({subject:m.subject,percentage:Math.round(m.obtained/m.maximum*100),type:m.type})),
    attendance,
    assignments: db.prepare(`SELECT a.*,s.name subject FROM assignments a JOIN subjects s ON s.id=a.subject_id ORDER BY a.due_date LIMIT 5`).all(),
    examinations: db.prepare(`SELECT e.*,s.name subject FROM examinations e JOIN subjects s ON s.id=e.subject_id ORDER BY exam_date LIMIT 5`).all()
  });
});

app.get('/api/subjects', auth, (req,res)=>res.json(db.prepare(`SELECT * FROM subjects ORDER BY name`).all()));
app.get('/api/assignments', auth, (req,res)=>res.json(db.prepare(`SELECT a.*,s.name subject FROM assignments a JOIN subjects s ON s.id=a.subject_id ORDER BY a.due_date`).all()));
app.post('/api/assignments', auth, requireRole('faculty','admin'), (req,res)=>{
  const {title,description,subjectId,dueDate} = req.body;
  if (!title || !subjectId || !dueDate) return res.status(400).json({error:'Title, subject and deadline are required'});
  const result=db.prepare(`INSERT INTO assignments(title,description,subject_id,due_date) VALUES (?,?,?,?)`).run(title,description||'',subjectId,dueDate);
  res.status(201).json({id:Number(result.lastInsertRowid)});
});
app.get('/api/examinations', auth, (req,res)=>res.json(db.prepare(`SELECT e.*,s.name subject FROM examinations e JOIN subjects s ON s.id=e.subject_id ORDER BY exam_date`).all()));
app.get('/api/resources', auth, (req,res)=>res.json(db.prepare(`SELECT r.*,s.name subject FROM resources r LEFT JOIN subjects s ON s.id=r.subject_id ORDER BY r.title`).all()));
app.get('/api/notifications', auth, (req,res)=>res.json(db.prepare(`SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC`).all(req.user.id)));
app.post('/api/notifications/:id/read', auth, (req,res)=>{db.prepare(`UPDATE notifications SET read=1 WHERE id=? AND user_id=?`).run(req.params.id,req.user.id);res.json({ok:true});});

app.get('/api/study/tasks', auth, requireRole('student'), (req,res)=>{
  const p=db.prepare(`SELECT id FROM student_profiles WHERE user_id=?`).get(req.user.id);
  res.json(p?db.prepare(`SELECT * FROM study_tasks WHERE student_id=? ORDER BY due_date`).all(p.id):[]);
});
app.post('/api/study/tasks', auth, requireRole('student'), (req,res)=>{
  const p=db.prepare(`SELECT id FROM student_profiles WHERE user_id=?`).get(req.user.id);
  const {title,subject,dueDate,priority}=req.body;
  if(!title) return res.status(400).json({error:'Task title is required'});
  const r=db.prepare(`INSERT INTO study_tasks(student_id,title,subject,due_date,priority) VALUES (?,?,?,?,?)`).run(p.id,title,subject||'',dueDate||'',priority||'medium');
  res.status(201).json({id:Number(r.lastInsertRowid)});
});
app.post('/api/study/tasks/:id/toggle', auth, requireRole('student'), (req,res)=>{
  db.prepare(`UPDATE study_tasks SET completed=CASE completed WHEN 1 THEN 0 ELSE 1 END WHERE id=?`).run(req.params.id);
  res.json({ok:true});
});
app.delete('/api/study/tasks/:id', auth, requireRole('student'), (req,res)=>{db.prepare(`DELETE FROM study_tasks WHERE id=?`).run(req.params.id);res.json({ok:true});});

app.get('/api/attendance', auth, (req,res)=>{
  if(req.user.role==='student'){
    const p=db.prepare(`SELECT id FROM student_profiles WHERE user_id=?`).get(req.user.id);
    const rows=db.prepare(`SELECT a.*,s.name subject FROM attendance a JOIN subjects s ON s.id=a.subject_id WHERE student_id=? ORDER BY date DESC`).all(p.id);
    return res.json(rows);
  }
  res.json(db.prepare(`SELECT a.*,s.name subject,sp.usn,u.name student FROM attendance a JOIN subjects s ON s.id=a.subject_id JOIN student_profiles sp ON sp.id=a.student_id JOIN users u ON u.id=sp.user_id ORDER BY date DESC`).all());
});
app.get('/api/marks', auth, (req,res)=>{
  if(req.user.role==='student'){
    const p=db.prepare(`SELECT id FROM student_profiles WHERE user_id=?`).get(req.user.id);
    return res.json(db.prepare(`SELECT m.*,s.name subject FROM marks m JOIN subjects s ON s.id=m.subject_id WHERE student_id=?`).all(p.id));
  }
  res.json(db.prepare(`SELECT m.*,s.name subject,sp.usn,u.name student FROM marks m JOIN subjects s ON s.id=m.subject_id JOIN student_profiles sp ON sp.id=m.student_id JOIN users u ON u.id=sp.user_id`).all());
});

app.get('/api/admin/overview', auth, requireRole('admin'), (req,res)=>res.json({
  students:db.prepare(`SELECT COUNT(*) n FROM users WHERE role='student'`).get().n,
  faculty:db.prepare(`SELECT COUNT(*) n FROM users WHERE role='faculty'`).get().n,
  departments:db.prepare(`SELECT COUNT(*) n FROM departments`).get().n,
  courses:db.prepare(`SELECT COUNT(*) n FROM courses`).get().n,
  subjects:db.prepare(`SELECT COUNT(*) n FROM subjects`).get().n,
  users:db.prepare(`SELECT id,name,email,role,active,created_at FROM users ORDER BY name`).all()
}));
app.post('/api/admin/users/:id/active', auth, requireRole('admin'), (req,res)=>{
  const u=db.prepare(`SELECT active FROM users WHERE id=?`).get(req.params.id);
  if(!u) return res.status(404).json({error:'User not found'});
  db.prepare(`UPDATE users SET active=? WHERE id=?`).run(u.active ? 0 : 1,req.params.id);
  res.json({ok:true});
});

app.get('/api/academic-intelligence', auth, requireRole('student'), (req,res)=>{
  const p=db.prepare(`SELECT id FROM student_profiles WHERE user_id=?`).get(req.user.id);
  const rows=db.prepare(`SELECT s.name subject, ROUND(AVG(m.obtained*100/m.maximum),1) percentage
    FROM marks m JOIN subjects s ON s.id=m.subject_id WHERE m.student_id=? GROUP BY s.id,s.name`).all(p.id);
  const analysis=rows.map(r=>{
    const category=r.percentage>=85?'Excellent':r.percentage>=70?'Good':r.percentage>=50?'Average':'Needs improvement';
    const risk=r.percentage<50?'High':r.percentage<70?'Medium':'Low';
    return {...r,category,risk,suggestion:r.percentage<50?`Prioritize ${r.subject} with daily practice and concept review.`:r.percentage<70?`Schedule two focused ${r.subject} revision sessions this week.`:`Continue regular ${r.subject} practice to maintain progress.`};
  });
  res.json({method:'Rule-based estimate',analysis});
});

app.post('/api/ai/chat', auth, requireRole('student'), async (req,res)=>{
  const {conversationId,message,subject}=req.body;
  if(!message) return res.status(400).json({error:'Message is required'});
  let answer;
  if(process.env.OPENAI_API_KEY){
    try{
      const response=await fetch(process.env.OPENAI_API_BASE||'https://api.openai.com/v1/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENAI_API_KEY}`},
        body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4o-mini',messages:[{role:'system',content:'You are LearnAI, a concise academic tutor.'},{role:'user',content:`Subject: ${subject||'General'}\n${message}`}],temperature:0.3})
      });
      if(!response.ok) throw new Error(`Provider returned ${response.status}`);
      const data=await response.json();
      answer=data.choices?.[0]?.message?.content;
    }catch(error){
      return res.status(502).json({error:'AI provider is unavailable',detail:error.message});
    }
  }else{
    answer=`Here is a structured study approach for “${message}”${subject?` in ${subject}`:''}:\n\n1. Review the core definitions and examples.\n2. Work through one basic problem, then one mixed problem.\n3. Explain the concept aloud or write a short summary.\n4. Finish with 5 practice questions and check each step.\n\nThis response is a rule-based study guide because no LLM API key is configured. Set OPENAI_API_KEY on the server to enable the genuine tutor integration.`;
  }
  if(conversationId){
    const row=db.prepare(`SELECT messages FROM conversations WHERE id=? AND user_id=?`).get(conversationId,req.user.id);
    if(row){
      const messages=JSON.parse(row.messages);
      messages.push({role:'user',content:message},{role:'assistant',content:answer});
      db.prepare(`UPDATE conversations SET messages=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(JSON.stringify(messages),conversationId);
    }
  }
  res.json({answer});
});
app.get('/api/conversations', auth, (req,res)=>res.json(db.prepare(`SELECT id,title,messages,updated_at FROM conversations WHERE user_id=? ORDER BY updated_at DESC`).all(req.user.id)));
app.post('/api/conversations', auth, (req,res)=>{
  const r=db.prepare(`INSERT INTO conversations(user_id,title,messages) VALUES (?,?,?)`).run(req.user.id,req.body.title||'New conversation','[]');
  res.status(201).json({id:Number(r.lastInsertRowid)});
});
app.delete('/api/conversations/:id', auth, (req,res)=>{db.prepare(`DELETE FROM conversations WHERE id=? AND user_id=?`).run(req.params.id,req.user.id);res.json({ok:true});});

app.get('/api/health', (req,res)=>res.json({ok:true,database:'SQLite',ai:process.env.OPENAI_API_KEY?'LLM key configured':'Rule-based fallback'}));

const distPath=path.resolve('dist');
if(fs.existsSync(distPath)){
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (req,res)=>res.sendFile(path.join(distPath,'index.html')));
}
app.listen(port,()=>console.log(`LearnAI API listening on http://localhost:${port}`));
