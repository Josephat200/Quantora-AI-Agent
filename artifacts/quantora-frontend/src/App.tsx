import { useEffect, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react';
import {
  ArrowRight,
  BarChart3,
  Check,
  CircleHelp,
  File,
  Files,
  FolderOpen,
  Github,
  LogOut,
  Menu,
  MessageSquare,
  Paperclip,
  Plus,
  RotateCcw,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  UploadCloud,
  Zap,
} from 'lucide-react';
import { api, type ApiConversation } from './services/api';

type View = 'landing' | 'signin' | 'register' | 'chat' | 'files' | 'settings';
type Role = 'user' | 'assistant';
type Message = { id: string; role: Role; text: string; time: string };
type Conversation = { id: string; title: string; updated: string; messages: Message[] };
type StoredFile = { id: string; name: string; size: string; type: string; status: 'ready' | 'processing'; added: string };

const nowLabel = () =>
  new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date());
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const seedConversations: Conversation[] = [
  {
    id: 'welcome',
    title: 'Welcome to Quantora',
    updated: 'Today',
    messages: [
      {
        id: 'welcome-assistant',
        role: 'assistant',
        text: "I’m Quantora. Bring me a question, a document, or a messy idea — I’ll help you find the signal and move it forward.",
        time: '9:41 AM',
      },
    ],
  },
  {
    id: 'briefing',
    title: 'Q3 product briefing',
    updated: 'Yesterday',
    messages: [
      { id: 'briefing-1', role: 'user', text: 'Turn the Q3 notes into a clear product briefing.', time: 'Yesterday' },
      { id: 'briefing-2', role: 'assistant', text: 'I found three threads: activation, retention, and the handoff between research and delivery. I can shape those into a concise narrative when you’re ready.', time: 'Yesterday' },
    ],
  },
  {
    id: 'research',
    title: 'Research synthesis',
    updated: 'Mon',
    messages: [
      { id: 'research-1', role: 'user', text: 'What patterns are hiding in my research notes?', time: 'Mon' },
      { id: 'research-2', role: 'assistant', text: 'The strongest pattern is a gap between what people say they need and when they actually reach for the product.', time: 'Mon' },
    ],
  },
];

const seedFiles: StoredFile[] = [
  { id: 'file-1', name: 'Q3 product brief.pdf', size: '2.4 MB', type: 'PDF', status: 'ready', added: 'Added today' },
  { id: 'file-2', name: 'customer-interviews.docx', size: '846 KB', type: 'DOCX', status: 'ready', added: 'Added yesterday' },
  { id: 'file-3', name: 'activation-signals.csv', size: '1.1 MB', type: 'CSV', status: 'ready', added: 'Added Mon' },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand" data-testid="brand-quantora">
      <img className={`brand-logo ${compact ? 'compact' : ''}`} src="/quantora-logo.png" alt="QUANTORA AI agent" />
    </span>
  );
}

function Landing({ go }: { go: (view: View) => void }) {
  return (
    <div className="landing noise">
      <nav className="landing-nav">
        <button className="brand" onClick={() => go('landing')} data-testid="button-home">
          <Brand />
        </button>
        <div className="landing-nav-actions">
          <button className="text-link" onClick={() => go('signin')} data-testid="button-nav-signin">Sign in</button>
          <button className="outline-button" onClick={() => go('register')} data-testid="button-nav-start">Get started <ArrowRight size={14} /></button>
        </div>
      </nav>
      <main className="landing-main">
        <div className="hero-grid">
          <section className="hero-copy">
            <div className="eyebrow">A focused AI workspace</div>
            <h1>Make room for<br /><em>better thinking.</em></h1>
            <p>Quantora is one calm place to ask, analyze, and act — with the context of your conversations, documents, and data close at hand.</p>
            <div className="hero-actions">
              <button className="solid-button" onClick={() => go('register')} data-testid="button-hero-start">Start thinking <ArrowRight size={15} /></button>
              <button className="ghost-button" onClick={() => go('signin')} data-testid="button-hero-signin">I already have an account</button>
            </div>
            <div className="hero-note"><ShieldCheck size={13} /> Your workspace stays yours.</div>
          </section>
          <section className="orbit-panel" aria-label="Quantora context visualization">
            <div className="orbit-grid" />
            <div className="orbit-ring" />
            <div className="orbit-core" />
            <div className="orbit-label one">CONVERSATIONS</div>
            <div className="orbit-label two">DOCUMENTS / 03</div>
            <div className="orbit-label three">ACTIONS READY</div>
            <div className="orbit-label four">CONTEXT INDEXED</div>
          </section>
        </div>
      </main>
      <section className="landing-bottom">
        <div className="principles">
          <div className="principles-intro"><div className="eyebrow">The Quantora principle</div><p>Less tab-switching. More useful distance between a thought and what you do with it.</p></div>
          <div className="principle"><Zap size={16} color="hsl(var(--cyan))" /><h3>Intelligence.</h3><p>Answers that are direct, considered, and grounded in the thread.</p></div>
          <div className="principle"><FolderOpen size={16} color="hsl(var(--purple))" /><h3>Context.</h3><p>Your files and decisions stay close to the conversation.</p></div>
          <div className="principle"><ArrowRight size={16} color="hsl(var(--cyan))" /><h3>Action.</h3><p>Move from “what if” to a next step you can actually take.</p></div>
        </div>
      </section>
    </div>
  );
}

function Auth({ mode, go, onSuccess }: { mode: 'signin' | 'register'; go: (view: View) => void; onSuccess: (name: string, token: string) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState<'Google' | 'GitHub' | ''>('');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === 'register' && name.trim().length < 2) return setError('Tell us your name to create a workspace.');
    if (!email.includes('@')) return setError('Enter a valid email address.');
    if (password.length < 6) return setError('Use at least 6 characters for your password.');
    setError('');
    setLoading(true);
    try {
      const response = mode === 'register'
        ? await api.register({ full_name: name.trim(), email, password })
        : await api.login({ email, password });
      onSuccess(response.user.full_name || response.user.email.split('@')[0], response.access_token);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to authenticate right now.');
    } finally {
      setLoading(false);
    }
  };
  const continueWithProvider = (provider: 'Google' | 'GitHub') => {
    setError(`${provider} sign-in is not configured yet. Use email authentication for this workspace.`);
  };
  return (
    <div className="auth-screen noise">
      <aside className="auth-aside">
        <button className="brand" onClick={() => go('landing')} data-testid="button-auth-home"><Brand /></button>
        <div className="auth-aside-copy"><div className="eyebrow">Intelligence. Context. Action.</div><h2>A quieter way to get to <span>clear.</span></h2><p>Quantora brings your questions, source material, and next moves into one focused workspace.</p></div>
        <div className="auth-quote">“The best assistant is the one that helps you hear your own thinking more clearly.”<b>— QUANTORA / 01</b></div>
      </aside>
      <main className="auth-form-side">
        <div className="auth-card">
          <div className="eyebrow">{mode === 'register' ? 'Create your workspace' : 'Welcome back'}</div>
          <h1>{mode === 'register' ? 'Start with a blank page.' : 'Good to see you.'}</h1>
          <p>{mode === 'register' ? 'A private place for better questions and useful answers.' : 'Your context is waiting where you left it.'}</p>
           <div className="provider-actions" aria-label="Social sign-in options">
             <button className="provider-button" type="button" onClick={() => continueWithProvider('Google')} disabled={Boolean(providerLoading)} data-testid="button-google-auth">
               <span className="provider-mark google-mark" aria-hidden="true">G</span>
               {providerLoading === 'Google' ? 'Connecting to Google…' : 'Continue with Google'}
             </button>
             <button className="provider-button" type="button" onClick={() => continueWithProvider('GitHub')} disabled={Boolean(providerLoading)} data-testid="button-github-auth">
               <Github size={16} aria-hidden="true" />
               {providerLoading === 'GitHub' ? 'Connecting to GitHub…' : 'Continue with GitHub'}
             </button>
           </div>
           <div className="auth-divider"><span>or continue with email</span></div>
           <form onSubmit={submit} noValidate>
            {mode === 'register' && <div className="form-field"><label htmlFor="auth-name">Your name</label><input id="auth-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="How should we call you?" data-testid="input-name" /></div>}
            <div className="form-field"><label htmlFor="auth-email">Email address</label><input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" data-testid="input-email" /></div>
            <div className="form-field"><label htmlFor="auth-password">Password</label><input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" data-testid="input-password" /></div>
            {error && <div className="form-error" data-testid="status-auth-error">{error}</div>}
              <button className="solid-button form-submit" type="submit" disabled={Boolean(providerLoading) || loading} data-testid="button-auth-submit">{loading ? 'Connecting…' : mode === 'register' ? 'Sign up with email' : 'Sign in with email'} {!loading && <ArrowRight size={14} />}</button>
          </form>
           <p className="auth-provider-note">Frontend demo mode: provider handoffs are simulated locally.</p>
          <div className="auth-switch">{mode === 'register' ? 'Already have an account?' : 'New to Quantora?'}<button onClick={() => go(mode === 'register' ? 'signin' : 'register')} data-testid="button-auth-switch">{mode === 'register' ? 'Sign in' : 'Create one'}</button></div>
        </div>
      </main>
    </div>
  );
}

function Sidebar({ view, setView, conversations, selectedId, newConversation, selectConversation, logout, user }: {
  view: View; setView: (view: View) => void; conversations: Conversation[]; selectedId: string; newConversation: () => void; selectConversation: (id: string) => void; logout: () => void; user: string;
}) {
  return (
    <>
      <aside className="sidebar">
        <button className="brand" onClick={() => setView('chat')} data-testid="button-sidebar-brand"><Brand /></button>
        <nav className="side-nav" aria-label="Main navigation">
          <div className="nav-label">Workspace</div>
          <button className={`nav-item ${view === 'chat' ? 'active' : ''}`} onClick={() => setView('chat')} data-testid="nav-chat"><MessageSquare size={16} /> Chat</button>
          <button className={`nav-item ${view === 'files' ? 'active' : ''}`} onClick={() => setView('files')} data-testid="nav-files"><Files size={16} /> Files <span className="faint mono" style={{ marginLeft: 'auto', fontSize: 10 }}>{readStorage<StoredFile[]>('quantora-files', seedFiles).length}</span></button>
          <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')} data-testid="nav-settings"><Settings size={16} /> Settings</button>
        </nav>
        <div className="side-divider" />
        <div className="history-heading"><span>Recent threads</span><button onClick={newConversation} aria-label="New conversation" data-testid="button-new-conversation"><Plus size={14} /></button></div>
        <div className="history-list">
          {conversations.slice(0, 6).map((conversation) => (
            <button className={`history-item ${selectedId === conversation.id ? 'selected' : ''}`} key={conversation.id} onClick={() => { selectConversation(conversation.id); setView('chat'); }} data-testid={`history-${conversation.id}`}><MessageSquare size={12} /><span>{conversation.title}</span></button>
          ))}
        </div>
        <div className="sidebar-footer">
          <div className="profile"><div className="avatar">{user.slice(0, 2).toUpperCase()}</div><div className="profile-text"><strong>{user}</strong><span>Personal workspace</span></div><button className="sidebar-action" onClick={logout} aria-label="Log out" data-testid="button-logout"><LogOut size={14} /></button></div>
        </div>
      </aside>
      <div className="mobile-topbar"><button className="brand" onClick={() => setView('chat')} data-testid="button-mobile-brand"><Brand compact /><span className="brand-word">QUANTORA</span></button><button className="icon-button" onClick={() => setView('settings')} aria-label="Open settings" data-testid="button-mobile-settings"><Menu size={17} /></button></div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button className={`nav-item ${view === 'chat' ? 'active' : ''}`} onClick={() => setView('chat')} data-testid="mobile-nav-chat"><MessageSquare size={17} /><span>Chat</span></button>
        <button className={`nav-item ${view === 'files' ? 'active' : ''}`} onClick={() => setView('files')} data-testid="mobile-nav-files"><Files size={17} /><span>Files</span></button>
        <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')} data-testid="mobile-nav-settings"><Settings size={17} /><span>Settings</span></button>
      </nav>
    </>
  );
}

function ChatView({ conversation, onSend, loading, onNew }: { conversation: Conversation; onSend: (text: string) => void; loading: boolean; onNew: () => void }) {
  const [draft, setDraft] = useState('');
  const send = () => { if (draft.trim() && !loading) { onSend(draft.trim()); setDraft(''); } };
  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } };
  const empty = conversation.messages.length === 0;
  return (
    <div className="chat-view">
      {empty ? <div className="chat-empty"><div className="mini-orbit" /><div className="eyebrow">A blank thread</div><h2>What are you working through?</h2><p>Ask a question, drop in context, or start with one of these. Quantora will keep the thread useful.</p><div className="suggestions"><button className="suggestion" onClick={() => setDraft('Help me make sense of this idea')} data-testid="suggestion-idea"><Sparkles size={15} />Help me make sense of this idea</button><button className="suggestion" onClick={() => setDraft('Turn my notes into a clear plan')} data-testid="suggestion-plan"><BarChart3 size={15} />Turn my notes into a clear plan</button><button className="suggestion" onClick={() => setDraft('What should I pay attention to?')} data-testid="suggestion-attention"><CircleHelp size={15} />What should I pay attention to?</button></div></div> :
        <div className="messages">{conversation.messages.map((message) => <div className={`message ${message.role}`} key={message.id}><div className="avatar">{message.role === 'assistant' ? <Sparkles size={13} /> : 'ME'}</div><div><div className="message-bubble">{message.text}</div><div className="message-meta">{message.role === 'assistant' ? 'QUANTORA' : 'YOU'} · {message.time}</div></div></div>)}{loading && <div className="message assistant"><div className="avatar"><Sparkles size={13} /></div><div className="message-bubble typing"><i /><i /><i /></div></div>}</div>}
      <div className="composer-wrap"><div className="composer"><div className="composer-tools"><button className="composer-tool" aria-label="Attach context" data-testid="button-attach"><Paperclip size={16} /></button><button className="composer-tool" onClick={onNew} aria-label="New thread" data-testid="button-composer-new"><Plus size={17} /></button></div><textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={keyDown} placeholder="Ask Quantora anything..." rows={1} data-testid="input-chat-message" /><button className="composer-send" onClick={send} disabled={!draft.trim() || loading} aria-label="Send message" data-testid="button-send-message"><Send size={15} /></button></div><div className="hero-note" style={{ justifyContent: 'center', marginTop: 13 }}>Quantora can make mistakes. Check important details.</div></div>
    </div>
  );
}

function FilesView({ files, addFiles, deleteFile }: { files: StoredFile[]; addFiles: (event: ChangeEvent<HTMLInputElement>) => void; deleteFile: (id: string) => void }) {
  return <div className="workspace-content"><div className="page-heading"><div><div className="eyebrow">Your context library</div><h1>Files</h1><p>Give Quantora the material behind the question.</p></div><label className="solid-button" htmlFor="file-upload" data-testid="button-upload-file"><UploadCloud size={14} /> Upload files<input id="file-upload" type="file" hidden multiple onChange={addFiles} data-testid="input-file-upload" /></label></div><div className="file-grid"><label className="upload-card" htmlFor="file-upload" data-testid="dropzone-upload"><div><UploadCloud size={22} /><span>Drop a file here</span><small>PDF, DOCX, CSV up to 25 MB</small></div></label>{files.map((file) => <article className="file-card" key={file.id} data-testid={`card-file-${file.id}`}><button className="file-delete" onClick={() => deleteFile(file.id)} aria-label={`Delete ${file.name}`} data-testid={`button-delete-file-${file.id}`}><Trash2 size={14} /></button><div className="file-icon">{file.type === 'CSV' ? <BarChart3 size={17} /> : <File size={17} />}</div><h3 title={file.name}>{file.name}</h3><p>{file.type} · {file.size}</p><div className={`file-status ${file.status === 'processing' ? 'processing' : ''}`}>{file.status === 'processing' ? <RotateCcw size={11} /> : <Check size={11} />}{file.status === 'processing' ? 'Processing' : file.added}</div></article>)}</div></div>;
}

function SettingsView({ user, setUser, theme, setTheme, onLogout }: { user: string; setUser: (name: string) => void; theme: 'dark' | 'light'; setTheme: (theme: 'dark' | 'light') => void; onLogout: () => void }) {
  const [name, setName] = useState(user);
  const [email, setEmail] = useState(() => localStorage.getItem('quantora-email') || `${user.toLowerCase().replace(/\s+/g, '.')}@quantora.app`);
  const [saved, setSaved] = useState(false);
  const [smartContext, setSmartContext] = useState(true);
  const [agentType, setAgentType] = useState(() => localStorage.getItem('quantora-agent') || 'general');
  const save = (event: FormEvent) => { event.preventDefault(); setUser(name.trim() || user); localStorage.setItem('quantora-email', email); localStorage.setItem('quantora-agent', agentType); setSaved(true); window.setTimeout(() => setSaved(false), 1800); };
  return <div className="workspace-content"><div className="page-heading"><div><div className="eyebrow">Workspace preferences</div><h1>Settings</h1><p>Make Quantora fit the way you think.</p></div></div><div className="settings-layout"><div className="settings-tabs"><button className="settings-tab active" data-testid="settings-tab-general">General</button><button className="settings-tab" onClick={() => setSmartContext(!smartContext)} data-testid="settings-tab-context">Context & privacy</button><button className="settings-tab" onClick={onLogout} data-testid="settings-tab-logout">Sign out</button></div><div><section className="settings-section"><h2>Profile</h2><p>This is how your workspace identifies you in a conversation.</p><form onSubmit={save}><div className="form-field"><label htmlFor="settings-name">Display name</label><input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} data-testid="input-settings-name" /></div><div className="form-field"><label htmlFor="settings-email">Email address</label><input id="settings-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-settings-email" /></div><div className="save-row"><button className="solid-button" type="submit" data-testid="button-save-settings">Save changes</button>{saved && <span className="saved-note" data-testid="status-settings-saved">Saved just now</span>}</div></form></section><section className="settings-section"><h2>Workspace</h2><p>Small controls for the way Quantora shows up.</p><div className="settings-row"><div><strong>Appearance</strong><span>Choose the atmosphere for your workspace.</span></div><button className="toggle on" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme" data-testid="toggle-theme"><Sun size={13} color="hsl(var(--cyan))" style={{ position: 'absolute', right: 5, top: 5 }} /></button></div><div className="settings-row"><div><strong>Use file context automatically</strong><span>Let relevant files inform new conversations.</span></div><button className={`toggle ${smartContext ? 'on' : ''}`} onClick={() => setSmartContext(!smartContext)} aria-label="Toggle file context" data-testid="toggle-file-context" /></div><div className="settings-row"><div><strong>Response style</strong><span>How Quantora should shape its first pass.</span></div><select className="select" value={agentType} onChange={(e) => { setAgentType(e.target.value); localStorage.setItem('quantora-agent', e.target.value); }} data-testid="select-response-style"><option value="general">Considered (General)</option><option value="research">Research</option><option value="coding">Coding</option><option value="data_analysis">Data Analysis</option><option value="document_analysis">Document Analysis</option></select></div></section><section className="settings-section"><h2>About your workspace</h2><p>Quantora is a focused space for intelligence, context, and action. Your prototype data is stored locally in this browser.</p><button className="ghost-button" onClick={() => { localStorage.clear(); window.location.reload(); }} data-testid="button-reset-workspace">Reset local workspace <RotateCcw size={13} /></button></section></div></div></div>;
}

function mapConversation(conversation: ApiConversation): Conversation {
  return {
    id: conversation.id,
    title: conversation.title,
    updated: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(conversation.updated_at)),
    messages: conversation.messages.map((message) => ({
      id: message.id,
      role: message.role,
      text: message.content,
      time: new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(message.created_at)),
    })),
  };
}

function Workspace({ user, setUser, logout }: { user: string; setUser: (name: string) => void; logout: () => void }) {
  const [view, setView] = useState<View>('chat');
  const [theme, setTheme] = useState<'dark' | 'light'>(readStorage<'dark' | 'light'>('quantora-theme', 'dark'));
  const [conversations, setConversations] = useState<Conversation[]>(readStorage('quantora-conversations', seedConversations));
  const [files, setFiles] = useState<StoredFile[]>(readStorage('quantora-files', seedFiles));
  const [selectedId, setSelectedId] = useState(conversations[0]?.id || 'new');
  const [loading, setLoading] = useState(false);
  const [syncError, setSyncError] = useState('');
  useEffect(() => { document.documentElement.classList.toggle('light', theme === 'light'); localStorage.setItem('quantora-theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('quantora-conversations', JSON.stringify(conversations)); }, [conversations]);
  useEffect(() => { localStorage.setItem('quantora-files', JSON.stringify(files)); }, [files]);
  useEffect(() => {
    if (!localStorage.getItem('quantora-token')) return;
    api.conversations()
      .then((remote) => {
        if (remote.length) {
          const mapped = remote.map(mapConversation);
          setConversations(mapped);
          setSelectedId(mapped[0].id);
        }
      })
      .catch((error) => setSyncError(error instanceof Error ? error.message : 'Unable to load conversations.'));
  }, []);
  const current = conversations.find((conversation) => conversation.id === selectedId) || { id: 'new', title: 'New conversation', updated: 'Now', messages: [] };
  const newConversation = () => {
    const fresh: Conversation = { id: makeId(), title: 'New conversation', updated: 'Now', messages: [] };
    setConversations((all) => [fresh, ...all]); setSelectedId(fresh.id); setView('chat');
  };
  const sendMessage = (text: string) => {
    const id = selectedId === 'new' ? makeId() : selectedId;
    if (selectedId === 'new') setSelectedId(id);
    const title = text.length > 29 ? `${text.slice(0, 29)}…` : text;
    const message: Message = { id: makeId(), role: 'user', text, time: nowLabel() };
    setConversations((all) => {
      const found = all.some((item) => item.id === id);
      if (!found) return [{ id, title, updated: 'Now', messages: [message] }, ...all];
      return all.map((item) => item.id === id ? { ...item, title: item.title === 'New conversation' ? title : item.title, updated: 'Now', messages: [...item.messages, message] } : item);
    });
     setLoading(true);
     setSyncError('');
     const isLocalSeed = ['welcome', 'briefing', 'research'].includes(id);
     const agent_type = localStorage.getItem('quantora-agent') || 'general';
     api.sendMessage({ message: text, agent_type, ...(isLocalSeed ? {} : { conversation_id: id }) })
       .then((response) => {
         const answer = { id: makeId(), role: 'assistant' as const, text: response.message, time: nowLabel() };
         setSelectedId(response.conversation_id);
         setConversations((all) => {
           const existing = all.find((item) => item.id === id);
           const next = { ...(existing ?? { id, title, updated: 'Now', messages: [message] }), id: response.conversation_id, updated: 'Now', messages: [...(existing?.messages ?? [message]), answer] };
           return [next, ...all.filter((item) => item.id !== id && item.id !== response.conversation_id)];
         });
       })
       .catch((error) => {
         const answer = { id: makeId(), role: 'assistant' as const, text: error instanceof Error ? error.message : 'The request could not be completed.', time: nowLabel() };
         setSyncError(answer.text);
         setConversations((all) => all.map((item) => item.id === id ? { ...item, messages: [...item.messages, answer] } : item));
       })
       .finally(() => setLoading(false));
  };
  const addFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files || []).map((file) => ({ id: makeId(), name: file.name, size: `${Math.max(1, Math.round(file.size / 1024))} KB`, type: file.name.split('.').pop()?.toUpperCase() || 'FILE', status: 'processing' as const, added: 'Added just now' }));
    if (!incoming.length) return;
    setFiles((all) => [...incoming, ...all]);
    const selectedFiles = Array.from(event.target.files || []);
    await Promise.all(selectedFiles.map(async (selectedFile, index) => {
      const localFile = incoming[index];
      try {
        const uploaded = await api.upload(selectedFile);
        setFiles((all) => all.map((item) => item.id === localFile.id ? { ...item, id: uploaded.file_id, size: `${Math.max(1, Math.round(uploaded.size / 1024))} KB`, type: selectedFile.name.split('.').pop()?.toUpperCase() || item.type, status: 'ready' } : item));
      } catch (error) {
        setSyncError(error instanceof Error ? error.message : `Unable to upload ${selectedFile.name}.`);
        setFiles((all) => all.filter((item) => item.id !== localFile.id));
      }
    }));
    event.target.value = '';
  };
  const deleteFile = (id: string) => {
    api.deleteFile(id).catch(() => undefined);
    setFiles((all) => all.filter((file) => file.id !== id));
  };
  return <div className="workspace noise"><Sidebar view={view} setView={setView} conversations={conversations} selectedId={selectedId} newConversation={newConversation} selectConversation={setSelectedId} logout={logout} user={user} /><main className="workspace-main"><header className="workspace-header"><div className="workspace-title"><span className="status-dot" /><h1>{view === 'chat' ? current.title : view === 'files' ? 'Files' : 'Settings'}</h1></div><div className="header-actions"><button className="icon-button hide-mobile" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme" data-testid="button-header-theme">{theme === 'dark' ? <Sun size={15} /> : <Sparkles size={15} />}</button><button className="icon-button hide-mobile" onClick={() => setView('settings')} aria-label="Open settings" data-testid="button-header-settings"><Settings size={15} /></button></div></header>{syncError && <div className="workspace-alert" role="status">{syncError}</div>}{view === 'chat' && <ChatView conversation={current} onSend={sendMessage} loading={loading} onNew={newConversation} />}{view === 'files' && <FilesView files={files} addFiles={addFiles} deleteFile={deleteFile} />}{view === 'settings' && <SettingsView user={user} setUser={setUser} theme={theme} setTheme={setTheme} onLogout={logout} />}</main></div>;
}

function App() {
  const [view, setView] = useState<View>(() => readStorage<View>('quantora-view', 'landing'));
  const [user, setUser] = useState(() => readStorage('quantora-user', 'Maya Chen'));
  useEffect(() => { localStorage.setItem('quantora-view', view); }, [view]);
  const login = (name: string, token: string) => { setUser(name); localStorage.setItem('quantora-user', name); localStorage.setItem('quantora-token', token); setView('chat'); };
  const logout = () => { setView('landing'); localStorage.removeItem('quantora-view'); localStorage.removeItem('quantora-token'); };
  if (view === 'landing') return <Landing go={setView} />;
  if (view === 'signin' || view === 'register') return <Auth mode={view} go={setView} onSuccess={login} />;
  return <Workspace user={user} setUser={(name) => { setUser(name); localStorage.setItem('quantora-user', name); }} logout={logout} />;
}

export default App;