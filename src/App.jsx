import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity, Bell, BookOpen, Bot, CalendarDays, ChevronRight, ClipboardCheck, Clock3,
  FileText, GraduationCap, LayoutDashboard, Library, LogOut, Menu, Moon, Settings,
  Sun, TrendingUp, UserRound, Users, X, Check, AlertTriangle, Search, Plus,
  Building2, Award, Upload, Send, Sparkles, BarChart3
} from 'lucide-react';

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

async function api(path, options = {}) {
  const token = localStorage.getItem('learnai_token');
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

function Footer() {
  return <footer><div className="container footer-grid"><div><Logo light/><p>One connected platform for learning, teaching, and academic success.</p></div><div><strong>Platform</strong><Link to="/features">Features</Link><Link to="/about">About</Link></div><div><strong>Access</strong><Link to="/login">Log in</Link><Link to="/register">Get started</Link></div><div><strong>Support</strong><Link to="/contact">Contact</Link><Link to="/forgot-password">Password reset</Link></div></div><div className="container footer-bottom"><span>© 2026 LearnAI</span><span>Built for demonstration</span></div></footer>;
}

function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return children;
}

const navByRole = {
  student: [
    ['/student/dashboard','Overview',LayoutDashboard],['/student/ai-assistant','AI Assistant',Bot],
    ['/student/my-learning','My Learning',TrendingUp],['/student/study-planner','Study Planner',CalendarDays],
    ['/student/attendance','Attendance',ClipboardCheck],['/student/performance','Performance',BarChart3],
    ['/student/assignments','Assignments',FileText],['/student/examinations','Examinations',Award],
    ['/student/resources','Resources',Library],['/student/notifications','Notifications',Bell],
    ['/student/profile','Profile',UserRound],['/student/settings','Settings',Settings]
  ],
  faculty: [
    ['/faculty/dashboard','Overview',LayoutDashboard],['/faculty/students','Students',Users],
    ['/faculty/attendance','Attendance',ClipboardCheck],['/faculty/assignments','Assignments',FileText],
    ['/faculty/marks','Marks',Award],['/faculty/resources','Resources',Library],
    ['/faculty/reports','Reports',BarChart3],['/faculty/profile','Profile',UserRound]
  ],
  admin: [
    ['/admin/dashboard','Overview',LayoutDashboard],['/admin/users','Users',Users],
    ['/admin/students','Students',GraduationCap],['/admin/faculty','Faculty',UserRound],
    ['/admin/departments','Departments',Building2],['/admin/courses','Courses',BookOpen],
    ['/admin/subjects','Subjects',Library],['/admin/analytics','Analytics',BarChart3],
    ['/admin/reports','Reports',FileText],['/admin/settings','Settings',Settings]
  ]
};

function DashboardShell({ role, children }) {
  const { user, logout } = useAuth();
  const [collapsed,setCollapsed]=useState(false);
  const [dark,setDark]=useState(()=>localStorage.getItem('learnai_theme')==='dark');
  const [notifications,setNotifications]=useState([]);
  const location=useLocation();
  const navigate=useNavigate();
  useEffect(()=>{document.documentElement.classList.toggle('dark',dark);localStorage.setItem('learnai_theme',dark?'dark':'light')},[dark]);
  useEffect(()=>{api('/api/notifications').then(setNotifications).catch(()=>setNotifications([]))},[]);
  const nav=navByRole[role];
  const title=nav.find(([path])=>location.pathname===path)?.[1]||'Workspace';
  const handleLogout=async()=>{await logout();navigate('/login',{replace:true})};
  return <div className={`app-shell ${collapsed?'collapsed':''}`}>
    <aside className="sidebar"><Link to={`/${role}/dashboard`}><Logo/></Link><nav>{nav.map(([path,label,Icon])=><Link className={location.pathname===path?'active':''} to={path} title={label} key={path}><Icon size={19}/><span>{label}</span></Link>)}</nav><button className="collapse-button" onClick={()=>setCollapsed(!collapsed)}><ChevronRight size={16}/></button></aside>
    <div className="workspace">
      <header className="topbar"><div><h2>{title}</h2></div><div className="top-actions"><button className="icon-button" onClick={()=>setDark(!dark)} aria-label="Toggle theme">{dark?<Sun size={18}/>:<Moon size={18}/>}</button><Link className="icon-button notification-button" to={`/${role}/notifications`}><Bell size={18}/>{notifications.some(n=>!n.read)&&<span/>}</Link><div className="user-chip"><div className="mini-avatar">{user.avatar||user.name.slice(0,2).toUpper()}</div><div><strong>{user.name}</strong><small>{role}</small></div></div><button className="icon-button" onClick={handleLogout} aria-label="Log out"><LogOut size={18}/></button></div></header>
      <main className="workspace-content">{children}</main>
    </div>
  </div>;
}

function Loading() { return <div className="loading-state"><span/><p>Loading academic data…</p></div>; }
function Empty({title='No records yet',text='Records will appear here when they are available.'}) { return <div className="empty-state"><BookOpen size={28}/><h3>{title}</h3><p>{text}</p></div>; }
function useData(path) {
  const [data,setData]=useState(null),[error,setError]=useState('');
  useEffect(()=>{api(path).then(setData).catch(e=>setError(e.message))},[path]);
  return {data,error};
}

function StatCard({icon:Icon,label,value,detail,tone='blue'}) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={20}/></div><div><span>{label}</span><strong>{value ?? '—'}</strong>{detail&&<small>{detail}</small>}</div></article>;
}

function StudentDashboard() {
  const { user } = useAuth();
  const {data,error}=useData('/api/student/dashboard');
  if(error)return <div className="error-state">{error}</div>;
  if(!data)return <Loading/>;
  const p=data.profile||{}, c=data.cards||{};
  return <>
    <div className="page-heading"><div><p>STUDENT WORKSPACE</p><h1>Good morning, {user?.name||'Student'}</h1><small>{p.usn} · {p.department} · {p.course} · Semester {p.semester} · Section {p.section}</small></div><div className="demo-label">Sample data in demo</div></div>
    <div className="stat-grid">
      <StatCard icon={ClipboardCheck} label="Attendance" value={c.attendance!=null?`${c.attendance}%`:'—'} detail="Overall" tone="green"/>
      <StatCard icon={Award} label="Current CGPA" value={c.cgpa??'—'} detail="Out of 10"/>
      <StatCard icon={Activity} label="Current SGPA" value={c.sgpa??'—'} detail="Latest semester"/>
      <StatCard icon={TrendingUp} label="Average marks" value={c.avgMarks!=null?`${c.avgMarks}%`:'—'} detail="Across recorded tests"/>
      <StatCard icon={FileText} label="Pending assignments" value={c.pendingAssignments??0} detail="Requires attention" tone="orange"/>
      <StatCard icon={CalendarDays} label="Upcoming exams" value={c.upcomingExams??0} detail="Scheduled" tone="navy"/>
    </div>
    <div className="dashboard-grid">
      <section className="panel performance-panel"><div className="panel-heading"><div><h3>Academic performance</h3><p>Subject-wise recorded marks</p></div><Link to="/student/performance">View details</Link></div>{data.performance?.length?<div className="subject-bars">{data.performance.map((m)=><div key={m.subject}><div><span>{m.subject}</span><strong>{m.percentage}%</strong></div><div className="bar"><span style={{width:`${m.percentage}%`,background:m.percentage<50?'#D9534F':m.percentage<70?'#F0A43A':'#4968E8'}}/></div></div>)}</div>:<Empty/>}</section>
      <section className="panel"><div className="panel-heading"><div><h3>Attendance overview</h3><p>Present classes by subject</p></div></div>{data.attendance?.length?<div className="attendance-list">{data.attendance.map(a=><div key={a.subject}><span>{a.subject}</span><b className={a.percentage<75?'danger':''}>{a.percentage}%</b><small>{a.present}/{a.total} classes</small></div>)}</div>:<Empty/>}</section>
      <section className="panel"><div className="panel-heading"><div><h3>Upcoming activities</h3><p>Deadlines and examinations</p></div></div><div className="activity-list">{data.assignments?.map(a=><Link to="/student/assignments" key={a.id}><div className="activity-icon"><FileText size={16}/></div><div><strong>{a.title}</strong><small>{a.subject} · Due {a.due_date}</small></div><ChevronRight size={16}/></Link>)}</div></section>
      <section className="panel ai-panel"><div className="panel-heading"><div><h3><Sparkles size={17}/> AI recommendations</h3><p>Rule-based academic analysis</p></div><Link to="/student/my-learning">Explore</Link></div><div className="recommendation"><span className="weak">Needs focus</span><strong>Data Structures</strong><p>Review trees and graphs, then practice 5 coding questions daily.</p></div></section>
    </div>
  </>;
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('learnai_user');
    return saved ? JSON.parse(saved) : null;
  });
  const login = async (email, password) => {
    const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('learnai_token', data.token);
    localStorage.setItem('learnai_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };
  const logout = async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch {}
    localStorage.removeItem('learnai_token');
    localStorage.removeItem('learnai_user');
    setUser(null);
  };
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

function Logo({ light = false }) {
  return <div className={`logo ${light ? 'logo-light' : ''}`}><span className="logo-mark"><GraduationCap size={19} /></span><span>Learn<span>AI</span></span></div>;
}

function PublicLayout() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="public-header">
        <div className="container nav">
          <Link to="/" aria-label="LearnAI home"><Logo /></Link>
          <nav className={open ? 'open' : ''}>
            <Link to="/" onClick={()=>setOpen(false)}>Home</Link>
            <Link to="/about" onClick={()=>setOpen(false)}>About</Link>
            <Link to="/features" onClick={()=>setOpen(false)}>Features</Link>
            <Link to="/contact" onClick={()=>setOpen(false)}>Contact</Link>
          </nav>
          <div className="nav-actions">
            <Link className="btn btn-ghost" to="/login">Log in</Link>
            <Link className="btn btn-primary" to="/register">Get Started</Link>
            <button className="menu-button" onClick={()=>setOpen(!open)} aria-label="Toggle menu">{open?<X/>:<Menu/>}</button>
          </div>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<PublicTextPage title="About LearnAI" eyebrow="Built for better learning" content="LearnAI brings academic records, personalized support, faculty workflows, and institutional administration into one secure, accessible platform." />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/contact" element={<PublicTextPage title="Contact" eyebrow="We’re here to help" content="For a demonstration or institutional access, email support@learnai.demo. For urgent account support, contact your institution administrator." />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
      </Routes>
      <Footer />
    </>
  );
}

function Landing() {
  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15}/> AI-powered academic ecosystem</div>
            <h1>Learn Smarter. Manage Better. <span>Achieve More.</span></h1>
            <p>An AI-powered student learning and management platform for personalized learning, intelligent analytics, and seamless academic management.</p>
            <div className="hero-actions"><Link className="btn btn-primary btn-large" to="/register">Get Started <ChevronRight size={17}/></Link><Link className="btn btn-outline btn-large" to="/features">Explore Features</Link></div>
            <div className="trust-row"><div className="avatar-stack"><span>AM</span><span>PS</span><span>RK</span></div><div><strong>Built for students & faculty</strong><small>One connected academic workspace</small></div></div>
          </div>
          <DashboardPreview />
        </div>
      </section>
      <section className="stats-strip"><div className="container stats-grid"><div><strong>21+</strong><span>Academic modules</span></div><div><strong>3</strong><span>Dedicated roles</span></div><div><strong>24/7</strong><span>AI study support</span></div><div><strong>100%</strong><span>Role-secured access</span></div></div></section>
      <section className="section" id="features"><div className="container"><SectionHeading eyebrow="Everything in one place" title="A smarter way to run student success" text="Focused tools for learning, teaching, and institutional operations."/><FeatureGrid /></div></section>
      <HowItWorks />
      <Testimonials />
      <FAQ />
    </main>
  );
}

function DashboardPreview() {
  return (
    <div className="preview-wrap">
      <div className="preview-glow"/>
      <div className="preview-card">
        <div className="preview-top"><div><span className="preview-dot"/><span className="preview-dot"/><span className="preview-dot"/></div><span>Student overview</span><Bell size={14}/></div>
        <div className="preview-body">
          <div className="preview-side"><div className="preview-logo"><GraduationCap size={16}/></div><span/><span/><span/><span/></div>
          <div className="preview-main">
            <div className="preview-heading"><div><small>GOOD MORNING</small><strong>Aarav Mehta</strong></div><div className="mini-avatar">AM</div></div>
            <div className="mini-cards"><div><span>Attendance</span><strong>82%</strong><small className="up">↑ 4.2%</small></div><div><span>CGPA</span><strong>8.2</strong><small>Semester 5</small></div><div><span>Pending</span><strong>3</strong><small>Assignments</small></div></div>
            <div className="preview-charts"><div className="preview-chart"><div className="chart-title">Academic performance</div><div className="bars">{[44,62,76,58,82,68].map((h,i)=><span key={i} style={{height:`${h}%`}} />)}</div></div><div className="preview-ai"><Bot size={20}/><strong>AI Academic Intelligence</strong><small>2 subjects need attention</small><div><span>DSA</span><b>45%</b></div><div><span>OS</span><b>58%</b></div></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow,title,text }) {
  return <div className="section-heading"><div className="eyebrow">{eyebrow}</div><h2>{title}</h2>{text&&<p>{text}</p>}</div>;
}
function FeatureGrid() {
  const items=[
    [Bot,'AI learning assistant','Ask questions, summarize material, and generate practice with secure academic context.'],
    [TrendingUp,'Academic intelligence','Understand strong and weak subjects using your real academic records.'],
    [CalendarDays,'Smart study planner','Turn available time and examination dates into a clear daily plan.'],
    [ClipboardCheck,'Attendance & marks','Track subject performance and attendance with transparent calculations.'],
    [FileText,'Assignments','Create, submit, evaluate, and receive feedback in one organized workflow.'],
    [Library,'Learning library','Organize authorized faculty resources by department, semester, and subject.']
  ];
  return <div className="feature-grid">{items.map(([Icon,title,text])=><article className="feature-card" key={title}><div className="feature-icon"><Icon size={21}/></div><h3>{title}</h3><p>{text}</p></article>)}</div>;
}
function HowItWorks() {
  const steps=[['01','Connect','Add academic information and learning goals.'],['02','Understand','View real performance and attendance insights.'],['03','Improve','Follow personalized study and practice recommendations.']];
  return <section className="section how"><div className="container"><SectionHeading eyebrow="How it works" title="From data to focused action"/><div className="steps">{steps.map(([n,t,d])=><div className="step" key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></div>)}</div></div></section>;
}
function Testimonials() {
  return <section className="section testimonials"><div className="container"><SectionHeading eyebrow="Sample testimonial" title="Designed around academic needs"/><div className="testimonial-grid">
    <article><p>“The subject insights help me prioritize revision before I fall behind.”</p><strong>Aarav M.</strong><small>Sample student review</small></article>
    <article><p>“A clear view of attendance and assignments makes class follow-up much faster.”</p><strong>Dr. Priya S.</strong><small>Sample faculty review</small></article>
  </div></div></section>;
}
function FAQ() {
  const faqs=[
    ['Is LearnAI using real student data?','Yes. Dashboard metrics are loaded from the SQLite database and sample records are explicitly labeled in the demo.'],
    ['Can students access faculty or admin tools?','No. Backend authorization and protected frontend routes enforce role permissions.'],
    ['Does the AI require an external API?','It uses a secure OpenAI-compatible endpoint when OPENAI_API_KEY is configured. Otherwise it clearly presents rule-based guidance.']
  ];
  return <section className="section"><div className="container"><SectionHeading eyebrow="FAQ" title="Frequently asked questions"/><div className="faq">{faqs.map(([q,a])=>{const [open,setOpen]=useState(false);return <article key={q}><button onClick={()=>setOpen(!open)}><span>{q}</span><Plus className={open?'rotate':''} size={18}/></button>{open&&<p>{a}</p>}</article>})}</div></div></section>;
}
function PublicTextPage({title,eyebrow,content}) {
  return <main className="public-page"><div className="container narrow"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{content}</p></div></main>;
}
function AuthPage({mode}) {
  const {login,user}=useAuth();
  const navigate=useNavigate();
  const [form,setForm]=useState({name:'',email:'',password:'',usn:''});
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  useEffect(()=>{ if(user) navigate(user.role==='admin'?'/admin/dashboard':`/${user.role}/dashboard`,{replace:true}); },[user]);
  if(mode==='forgot') return <main className="auth-page"><div className="auth-card"><Logo/><h1>Reset your password</h1><p>Contact your institution administrator to securely reset account access.</p><Link className="btn btn-primary auth-submit" to="/login">Back to login</Link></div></main>;
  const handleSubmit=async(e)=>{
    e.preventDefault();setError('');setBusy(true);
    try{
      if(mode==='login'){
        const u=await login(form.email,form.password);
        navigate(u.role==='admin'?'/admin/dashboard':`/${u.role}/dashboard`);
      }else{
        await api('/api/auth/register',{method:'POST',body:JSON.stringify(form)});
        navigate('/login');
      }
    }catch(err){setError(err.message)}finally{setBusy(false)}
  };
  return <main className="auth-page"><div className="auth-card"><Logo/><h1>{mode==='login'?'Welcome back':'Create student account'}</h1><p>{mode==='login'?'Sign in to your academic workspace.':'Register a student profile. Administrator accounts require secure provisioning.'}</p>
    {mode==='login'&&<div className="demo-logins"><span>Demo access</span><button type="button" onClick={()=>setForm({name:'',email:'student@learnai.demo',password:'Student@123',usn:''})}>Student</button><button type="button" onClick={()=>setForm({name:'',email:'faculty@learnai.demo',password:'Faculty@123',usn:''})}>Faculty</button><button type="button" onClick={()=>setForm({name:'',email:'admin@learnai.demo',password:'Admin@123',usn:''})}>Admin</button></div>}
    <form onSubmit={handleSubmit}>
      {mode==='register'&&<label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>}
      {mode==='register'&&<label>USN / Student ID<input required value={form.usn} onChange={e=>setForm({...form,usn:e.target.value})}/></label>}
      <label>Email address<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
      <label>Password<input type="password" required minLength={mode==='register'?8:1} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>
      {mode==='login'&&<div className="form-meta"><span/><Link to="/forgot-password">Forgot password?</Link></div>}
      {error&&<div className="form-error"><AlertTriangle size={16}/>{error}</div>}
      <button className="btn btn-primary auth-submit" disabled={busy}>{busy?'Please wait…':mode==='login'?'Sign in':'Create account'}<ChevronRight size={16}/></button>
    </form>
    <p className="auth-switch">{mode==='login'?<>New to LearnAI? <Link to="/register">Create account</Link></>:<>Already registered? <Link to="/login">Sign in</Link></>}</p>
  </div></main>;
}

function FeaturesPage() {
  return <main className="public-page"><div className="container"><SectionHeading eyebrow="Platform features" title="Tools for every academic role"/><FeatureGrid /></div></main>;
}

function PageHeader({title,subtitle,action}) {
  return <div className="page-heading"><div><p>ACADEMIC WORKSPACE</p><h1>{title}</h1>{subtitle&&<small>{subtitle}</small>}</div>{action&&<button className="btn btn-primary" onClick={action.onClick}><Plus size={16}/>{action.label}</button>}</div>;
}

function DataTable({columns,rows}) {
  if(!rows?.length) return <Empty />;
  return <div className="table-wrap"><table><thead><tr>{columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{columns.map(c=>{const key=c.toLowerCase().replaceAll(' ','_');return <td key={c}>{String(row[key]??row[c]??'—')}</td>})}</tr>)}</tbody></table></div>;
}

function AssignmentsPage() {
  const {data,error}=useData('/api/assignments');
  if(error)return <div className="error-state">{error}</div>;
  if(!data)return <Loading />;
  return <><PageHeader title="Assignments" subtitle="Track deadlines and submission status"/><div className="assignment-list">{data.map(a=><article key={a.id} className="assignment-row"><div className="activity-icon"><FileText size={18}/></div><div><h3>{a.title}</h3><p>{a.description||'Assignment details'}</p><small>{a.subject} · Due {a.due_date}</small></div><span className="status pending">Pending</span></article>)}</div></>;
}

function AttendancePage() {
  const {data,error}=useData('/api/attendance');
  if(error)return <div className="error-state">{error}</div>;
  if(!data)return <Loading />;
  const grouped=data.reduce((acc,r)=>{acc[r.subject]=(acc[r.subject]||{subject:r.subject,total:0,present:0});acc[r.subject].total++;if(r.status==='present')acc[r.subject].present++;return acc},{});
  const rows=Object.values(grouped).map(r=>({...r,percentage:`${Math.round(r.present/r.total*100)}%`,record:r.present+'/'+r.total}));
  return <><PageHeader title="Attendance" subtitle="Calculated as present classes divided by conducted classes"/><div className="panel"><DataTable columns={['Subject','Percentage','Record']} rows={rows}/></div></>;
}

function MarksPage() {
  const {data,error}=useData('/api/marks');
  if(error)return <div className="error-state">{error}</div>;
  if(!data)return <Loading />;
  const rows=data.map(r=>({...r,percentage:`${Math.round(r.obtained/r.maximum*100)}%`,score:`${r.obtained}/${r.maximum}`}));
  return <><PageHeader title="Academic performance" subtitle="Recorded subject marks"/><div className="panel"><DataTable columns={['Subject','Type','Score','Percentage']} rows={rows}/></div></>;
}

function ExaminationsPage() {
  const {data,error}=useData('/api/examinations');
  if(error)return <div className="error-state">{error}</div>;
  if(!data)return <Loading />;
  return <><PageHeader title="Examinations" subtitle="Authorized examination schedule"/><div className="exam-grid">{data.map(e=><article className="exam-card" key={e.id}><div><CalendarDays size={18}/></div><h3>{e.title}</h3><p>{e.subject}</p><strong>{new Date(e.exam_date).toLocaleDateString()}</strong><small>{e.syllabus}</small></article>)}</div></>;
}

function ResourcesPage() {
  const {data,error}=useData('/api/resources');
  if(error)return <div className="error-state">{error}</div>;
  if(!data)return <Loading />;
  return <><PageHeader title="Learning resources" subtitle="Authorized study materials"/><div className="resource-grid">{data.map(r=><article className="resource-card" key={r.id}><div className="resource-icon"><FileText size={22}/></div><div><h3>{r.title}</h3><p>{r.subject||'General'} · {r.kind||'Document'}</p></div><button className="icon-button" aria-label={`Download ${r.title}`}><ChevronRight size={17}/></button></article>)}</div></>;
}

function NotificationsPage() {
  const {data,error}=useData('/api/notifications');
  if(error)return <div className="error-state">{error}</div>;
  if(!data)return <Loading />;
  const mark=async id=>{await api(`/api/notifications/${id}/read`,{method:'POST'});window.location.reload()};
  return <><PageHeader title="Notifications" subtitle="Academic updates for your account"/><div className="notification-list">{data.length?data.map(n=><article className={n.read?'':'unread'} key={n.id}><div className="activity-icon"><Bell size={17}/></div><div><h3>{n.title}</h3><p>{n.body}</p><small>{n.category} · {n.created_at}</small></div><button className="btn btn-ghost" onClick={()=>mark(n.id)}>{n.read?'Read':'Mark read'}</button></article>):<Empty title="No notifications"/>}</div></>;
}

function StudyPlannerPage() {
  const {data,error}=useData('/api/study/tasks');
  const [title,setTitle]=useState('');
  const [subject,setSubject]=useState('Data Structures');
  const [message,setMessage]=useState('');
  const add=async(e)=>{e.preventDefault();try{await api('/api/study/tasks',{method:'POST',body:JSON.stringify({title,subject,dueDate:'2026-12-01',priority:'high'})});setTitle('');setMessage('Task added');window.location.reload()}catch(err){setMessage(err.message)}};
  if(error)return <div className="error-state">{error}</div>;
  if(!data)return <Loading />;
  return <><PageHeader title="Smart study planner" subtitle="AI-recommended planning with editable tasks"/><div className="planner-layout"><section className="panel"><div className="panel-heading"><div><h3>Today’s study tasks</h3><p>Based on your weak subjects and deadlines</p></div></div><div className="task-list">{data.map(t=><article key={t.id}><button className={`task-check ${t.completed?'done':''}`} onClick={async()=>{await api(`/api/study/tasks/${t.id}/toggle`,{method:'POST'});window.location.reload()}}>{t.completed&&<Check size={14}/>}</button><div><strong>{t.title}</strong><small>{t.subject} · {t.due_date||'No deadline'}</small></div><b className={t.priority==='high'?'danger':''}>{t.priority}</b></article>)}</div></section><section className="panel"><h3>Add study task</h3><form className="compact-form" onSubmit={add}><label>Task<input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Practice graph traversal"/></label><label>Subject<select value={subject} onChange={e=>setSubject(e.target.value)}><option>Data Structures</option><option>DBMS</option><option>Operating Systems</option><option>Machine Learning</option></select></label><button className="btn btn-primary"><Plus size={16}/>Add task</button>{message&&<p className="form-message">{message}</p>}</form></section></div></>;
}

function AIAssistantPage() {
  const [message,setMessage]=useState('');
  const [subject,setSubject]=useState('General');
  const [messages,setMessages]=useState([]);
  const [busy,setBusy]=useState(false);
  const ask=async(text=message)=>{
    if(!text.trim())return;
    setMessages(m=>[...m,{role:'user',content:text}]);setMessage('');setBusy(true);
    try{const r=await api('/api/ai/chat',{method:'POST',body:JSON.stringify({message:text,subject})});setMessages(m=>[...m,{role:'assistant',content:r.answer}])}catch(e){setMessages(m=>[...m,{role:'assistant',content:`Error: ${e.message}`,error:true}])}finally{setBusy(false)}
  };
  const suggestions=['Explain data structures','Teach me Python loops','Create a DSA study plan','Generate 20 MCQs on operating systems'];
  return <><PageHeader title="AI Academic Assistant" subtitle="Secure academic tutor · Conversation context"/><div className="chat-layout"><aside className="chat-sidebar"><button className="btn btn-primary" onClick={()=>setMessages([])}><Plus size={16}/>New conversation</button><h4>Subject</h4><select value={subject} onChange={e=>setSubject(e.target.value)}><option>General</option><option>Data Structures</option><option>DBMS</option><option>Operating Systems</option><option>Machine Learning</option><option>Programming</option></select></aside><section className="chat-panel"><div className="chat-messages">{!messages.length?<div className="chat-empty"><Bot size={32}/><h3>How can I help you learn?</h3><p>Ask for explanations, practice questions, summaries, or a study plan.</p><div>{suggestions.map(s=><button key={s} onClick={()=>ask(s)}>{s}</button>)}</div></div>:messages.map((m,i)=><article className={m.role} key={i}>{m.role==='assistant'&&<div className="bot-avatar"><Bot size={16}/></div>}<div><small>{m.role==='assistant'?'LearnAI':'You'}</small><p>{m.content}</p></div></article>)}{busy&&<article className="assistant"><div className="bot-avatar"><Bot size={16}/></div><div className="typing"><span/><span/><span/></div></article>}</div><form className="chat-input" onSubmit={e=>{e.preventDefault();ask()}}><input value={message} onChange={e=>setMessage(e.target.value)} placeholder={`Ask about ${subject.toLowerCase()}…`}/><button className="send-button" aria-label="Send message"><Send size={18}/></button></form></section></div></>;
}

function AcademicIntelligencePage() {
  const {data,error}=useData('/api/academic-intelligence');
  if(error)return <div className="error-state">{error}</div>;
  if(!data)return <Loading />;
  return <><PageHeader title="AI Academic Intelligence" subtitle="Rule-based estimates calculated from current marks"/><div className="analysis-banner"><Sparkles size={20}/><div><strong>{data.method}</strong><p>Scores are grouped subject averages, not a trained machine-learning prediction.</p></div></div><div className="intelligence-grid">{data.analysis.map(a=><article className="intelligence-card" key={a.subject}><div><span>{a.category}</span><b className={a.risk==='High'?'danger':''}>{a.risk} risk</b></div><h3>{a.subject}</h3><strong className="intelligence-score">{a.percentage}%</strong><p>{a.suggestion}</p></article>)}</div></>;
}

function FacultyDashboard() {
  const attendance=useData('/api/attendance');
  const marks=useData('/api/marks');
  const assignments=useData('/api/assignments');
  if(attendance.error||marks.error||assignments.error)return <div className="error-state">Unable to load faculty data</div>;
  if(!attendance.data||!marks.data||!assignments.data)return <Loading />;
  const studentCount=new Set(attendance.data.map(r=>r.usn)).size;
  return <><PageHeader title="Faculty overview" subtitle="Assigned academic activity"/><div className="stat-grid"><StatCard icon={Users} label="Assigned students" value={studentCount||0}/><StatCard icon={BookOpen} label="Assigned subjects" value={new Set(attendance.data.map(r=>r.subject)).size} tone="green"/><StatCard icon={ClipboardCheck} label="Attendance records" value={attendance.data.length} tone="navy"/><StatCard icon={FileText} label="Assignments" value={assignments.data.length} tone="orange"/><StatCard icon={TrendingUp} label="Marks records" value={marks.data.length} tone="green"/></div><div className="panel"><div className="panel-heading"><div><h3>Student performance table</h3><p>Actual records visible to authorized faculty</p></div></div><DataTable columns={['Student','USN','Subject','Type','Score']} rows={marks.data.map(r=>({...r,student:r.student||'Student',score:`${r.obtained}/${r.maximum}`}))}/></div></>;
}

function AdminDashboard() {
  const {data,error}=useData('/api/admin/overview');
  if(error)return <div className="error-state">{error}</div>;
  if(!data)return <Loading />;
  return <><PageHeader title="Institution overview" subtitle="Real platform and account totals"/><div className="stat-grid"><StatCard icon={GraduationCap} label="Students" value={data.students}/><StatCard icon={Users} label="Faculty" value={data.faculty} tone="green"/><StatCard icon={Building2} label="Departments" value={data.departments} tone="navy"/><StatCard icon={BookOpen} label="Courses" value={data.courses} tone="orange"/><StatCard icon={Library} label="Subjects" value={data.subjects}/></div><div className="panel"><div className="panel-heading"><div><h3>User management</h3><p>Activate or deactivate platform accounts</p></div></div><div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>{data.users.map(u=><tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td><span className={`status ${u.active?'active':'inactive'}`}>{u.active?'Active':'Inactive'}</span></td><td><button className="btn btn-ghost" onClick={async()=>{await api(`/api/admin/users/${u.id}/active`,{method:'POST'});window.location.reload()}}>{u.active?'Deactivate':'Activate'}</button></td></tr>)}</tbody></table></div></div></>;
}

function ProfilePage() {
  const {user}=useAuth();
  return <><PageHeader title="Profile" subtitle="Account information"/><section className="profile-card"><div className="profile-avatar">{user.avatar||user.name.slice(0,2).toUpper()}</div><div><h2>{user.name}</h2><p>{user.email}</p><span className="role-tag">{user.role}</span></div></section></>;
}

function SettingsPage() {
  const [status,setStatus]=useState('');
  return <><PageHeader title="Settings" subtitle="Personal workspace preferences"/><section className="panel settings-panel"><h3>Appearance</h3><p>The interface follows the theme selected from the top bar.</p><button className="btn btn-primary" onClick={()=>setStatus('Preferences are saved locally in this browser.')}>Save preferences</button>{status&&<p className="form-message">{status}</p>}</section></>;
}

function GenericAdminPage({title,subtitle,icon:Icon}) {
  return <><PageHeader title={title} subtitle={subtitle}/><section className="panel"><Empty title={`${title} records`} text="Use the database-backed administration API to add and manage these records."/><div className="generic-icon"><Icon size={28}/></div></section></>;
}

function AppRoutes() {
  return <Routes>
    <Route path="/*" element={<PublicLayout/>}/>
  </Routes>;
}

export default function App() {
  return <AuthProvider><Routes>
    <Route path="/" element={<PublicLayout/>}/>
    <Route path="/about" element={<PublicLayout/>}/>
    <Route path="/features" element={<PublicLayout/>}/>
    <Route path="/contact" element={<PublicLayout/>}/>
    <Route path="/login" element={<PublicLayout/>}/>
    <Route path="/register" element={<PublicLayout/>}/>
    <Route path="/forgot-password" element={<PublicLayout/>}/>
    <Route path="/student/*" element={<ProtectedRoute roles={['student']}><DashboardShell role="student"><Routes>
      <Route path="dashboard" element={<StudentDashboard/>}/>
      <Route path="ai-assistant" element={<AIAssistantPage/>}/>
      <Route path="my-learning" element={<AcademicIntelligencePage/>}/>
      <Route path="study-planner" element={<StudyPlannerPage/>}/>
      <Route path="attendance" element={<AttendancePage/>}/>
      <Route path="performance" element={<MarksPage/>}/>
      <Route path="assignments" element={<AssignmentsPage/>}/>
      <Route path="examinations" element={<ExaminationsPage/>}/>
      <Route path="resources" element={<ResourcesPage/>}/>
      <Route path="notifications" element={<NotificationsPage/>}/>
      <Route path="profile" element={<ProfilePage/>}/>
      <Route path="settings" element={<SettingsPage/>}/>
    </Routes></DashboardShell></ProtectedRoute>}/>
    <Route path="/faculty/*" element={<ProtectedRoute roles={['faculty']}><DashboardShell role="faculty"><Routes>
      <Route path="dashboard" element={<FacultyDashboard/>}/>
      <Route path="students" element={<FacultyDashboard/>}/>
      <Route path="attendance" element={<AttendancePage/>}/>
      <Route path="assignments" element={<AssignmentsPage/>}/>
      <Route path="marks" element={<MarksPage/>}/>
      <Route path="resources" element={<ResourcesPage/>}/>
      <Route path="reports" element={<FacultyDashboard/>}/>
      <Route path="profile" element={<ProfilePage/>}/>
    </Routes></DashboardShell></ProtectedRoute>}/>
    <Route path="/admin/*" element={<ProtectedRoute roles={['admin']}><DashboardShell role="admin"><Routes>
      <Route path="dashboard" element={<AdminDashboard/>}/>
      <Route path="users" element={<AdminDashboard/>}/>
      <Route path="students" element={<GenericAdminPage title="Student management" subtitle="Student profiles and enrollments" icon={GraduationCap}/>}/>
      <Route path="faculty" element={<GenericAdminPage title="Faculty management" subtitle="Faculty profiles and subject assignments" icon={Users}/>}/>
      <Route path="departments" element={<GenericAdminPage title="Departments" subtitle="Institutional departments" icon={Building2}/>}/>
      <Route path="courses" element={<GenericAdminPage title="Courses" subtitle="Courses and academic programs" icon={BookOpen}/>}/>
      <Route path="subjects" element={<GenericAdminPage title="Subjects" subtitle="Curriculum subjects and codes" icon={Library}/>}/>
      <Route path="analytics" element={<GenericAdminPage title="Institutional analytics" subtitle="Aggregate academic reporting" icon={BarChart3}/>}/>
      <Route path="reports" element={<GenericAdminPage title="Academic reports" subtitle="Department and semester reports" icon={FileText}/>}/>
      <Route path="settings" element={<SettingsPage/>}/>
    </Routes></DashboardShell></ProtectedRoute>}/>
  </Routes></AuthProvider>;
}

