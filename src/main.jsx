import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../public/styles.css';

const statuses = ['Open', 'In Progress', 'Closed'];
const api = async (url, options) => {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
};
const formatDate = value => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
const Badge = ({ status }) => <span className={`badge ${status.replace(' ', '')}`}>{status}</span>;
const isAtRisk = ticket => ticket.status !== 'Closed' && (Date.now() - new Date(ticket.updated_at).getTime()) > 24 * 60 * 60 * 1000;
const slaLabel = ticket => ticket.status === 'Closed' ? 'Resolved' : isAtRisk(ticket) ? 'Needs follow-up' : 'On track';

function CreateTicket({ onClose, onCreated }) {
  const [error, setError] = useState('');
  const submit = async event => {
    event.preventDefault(); setError('');
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    try { const ticket = await api('/api/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); onCreated(ticket); }
    catch (err) { setError(err.message); }
  };
  return <Modal onClose={onClose}><p className="eyebrow">NEW REQUEST</p><h2>Create a ticket</h2><form onSubmit={submit}><div className="two"><Field label="Customer name" name="customer_name" placeholder="e.g. Maya Patel" required /><Field label="Email address" name="customer_email" type="email" placeholder="maya@example.com" required /></div><Field label="Issue title" name="subject" placeholder="Briefly describe the issue" required /><label>Description<textarea required name="description" rows="5" placeholder="Share the details your team will need..." /></label><p className="form-error">{error}</p><button className="primary wide">Create ticket</button></form></Modal>;
}
function Field({ label, ...props }) { return <label>{label}<input {...props} /></label>; }
function Modal({ children, onClose }) { return <div className="modal" onMouseDown={event => event.target === event.currentTarget && onClose()}><div className="modal-card"><button className="close" onClick={onClose}>×</button>{children}</div></div>; }

function TicketDetail({ ticketId, onClose, onSaved }) {
  const [ticket, setTicket] = useState(null); const [error, setError] = useState('');
  const load = async () => { try { setTicket(await api(`/api/tickets/${ticketId}`)); } catch (err) { setError(err.message); } };
  useEffect(() => { load(); }, [ticketId]);
  const submit = async event => { event.preventDefault(); setError(''); try { await api(`/api/tickets/${ticketId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); await load(); onSaved(); } catch (err) { setError(err.message); } };
  return <Modal onClose={onClose}>{!ticket ? <p>{error || 'Loading ticket...'}</p> : <><div className="detail-head"><div><p className="eyebrow">{ticket.ticket_id}</p><h2>{ticket.subject}</h2></div><Badge status={ticket.status} /></div><p className="meta"><strong>{ticket.customer_name}</strong> · {ticket.customer_email}<br />Created {formatDate(ticket.created_at)}</p><div className="description">{ticket.description}</div><div className="notes"><strong>Activity</strong>{ticket.notes.length ? ticket.notes.map(note => <div className="note" key={note.id}>{note.note_text}<small>{formatDate(note.created_at)}</small></div>) : <p className="subtle">No internal notes yet.</p>}</div><form className="update-box" onSubmit={submit}><div className="update-grid"><label>Status<select name="status" defaultValue={ticket.status}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label><label>Add internal note<textarea name="notes" rows="2" placeholder="Leave a note for your team" /></label></div><p className="form-error">{error}</p><button className="primary">Save changes</button></form></>}</Modal>;
}

function App() {
  const [tickets, setTickets] = useState([]); const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [activeTicket, setActiveTicket] = useState(null); const [creating, setCreating] = useState(false); const [notice, setNotice] = useState('');
  const load = async () => { try { setTickets(await api(`/api/tickets?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`)); } catch (err) { setNotice(err.message); } };
  useEffect(() => { const timer = setTimeout(load, 180); return () => clearTimeout(timer); }, [search, status]);
  const metrics = useMemo(() => ({ 'All tickets': tickets.length, Open: tickets.filter(t => t.status === 'Open').length, 'In Progress': tickets.filter(t => t.status === 'In Progress').length, 'Needs follow-up': tickets.filter(isAtRisk).length }), [tickets]);
  const saved = () => { load(); setNotice('Ticket updated'); setTimeout(() => setNotice(''), 2600); };
  return <div className="shell"><aside><a className="brand" href="#tickets"><span>✦</span> HelioDesk</a><p className="workspace">WORKSPACE</p><nav><a className="active" href="#tickets">⌁ Tickets</a><a href="#new-ticket" onClick={e => { e.preventDefault(); setCreating(true); }}>＋ Create ticket</a></nav><div className="sidebar-note"><strong>Support, made clear.</strong><br />Keep every customer conversation in one calm place.</div></aside><main><header><div><p className="eyebrow">CUSTOMER SUPPORT</p><h1>Tickets</h1><p className="subtle">A shared view of every customer need.</p></div><button className="primary" onClick={() => setCreating(true)}>＋ New ticket</button></header><section className="metrics">{Object.entries(metrics).map(([name, count]) => <div className="metric" key={name}><span>{name}</span><strong>{count}</strong></div>)}</section><section className="toolbar"><label className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets, customers, or email" /></label><select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{statuses.map(item => <option key={item}>{item}</option>)}</select></section><section className="ticket-panel"><div className="panel-heading"><strong>All tickets</strong><span>{tickets.length} ticket{tickets.length === 1 ? '' : 's'}</span></div><div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Customer</th><th>Subject</th><th>Status</th><th>Updated</th><th /></tr></thead><tbody>{tickets.map(ticket => <tr key={ticket.ticket_id} onClick={() => setActiveTicket(ticket.ticket_id)}><td><span className="ticket-id">{ticket.ticket_id}</span></td><td><span className="customer">{ticket.customer_name}</span><span className="email">{ticket.customer_email}</span></td><td className="subject">{ticket.subject}</td><td><Badge status={ticket.status} /></td><td className="date">{formatDate(ticket.updated_at)}</td><td className="arrow">›</td></tr>)}</tbody></table></div>{!tickets.length && <div className="empty">No tickets match those filters.</div>}</section></main>{creating && <CreateTicket onClose={() => setCreating(false)} onCreated={ticket => { setCreating(false); saved(); setActiveTicket(ticket.ticket_id); }} />}{activeTicket && <TicketDetail ticketId={activeTicket} onClose={() => setActiveTicket(null)} onSaved={saved} />}{notice && <div className="toast">{notice}</div>}</div>;
}
createRoot(document.getElementById('root')).render(<App />);
