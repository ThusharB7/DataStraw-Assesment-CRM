const $ = (s) => document.querySelector(s);
let tickets = [];
const formatDate = (value) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;' })[char]);
const badge = (status) => `<span class="badge ${status.replace(' ', '')}">${status}</span>`;
async function request(url, options) { const r = await fetch(url, options); const data = await r.json(); if (!r.ok) throw new Error(data.error || 'Something went wrong.'); return data; }
async function loadTickets() {
  const search = $('#search').value.trim(), status = $('#statusFilter').value;
  tickets = await request(`/api/tickets?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`);
  $('#resultCount').textContent = `${tickets.length} ticket${tickets.length === 1 ? '' : 's'}`;
  $('#ticketRows').innerHTML = tickets.map(t => `<tr data-ticket="${t.ticket_id}"><td><span class="ticket-id">${t.ticket_id}</span></td><td><span class="customer">${escapeHtml(t.customer_name)}</span><span class="email">${escapeHtml(t.customer_email)}</span></td><td class="subject">${escapeHtml(t.subject)}</td><td>${badge(t.status)}</td><td class="date">${formatDate(t.updated_at)}</td><td class="arrow">›</td></tr>`).join('');
  $('#empty').classList.toggle('hidden', tickets.length > 0); renderMetrics();
}
function renderMetrics() { const counts = { 'All tickets':tickets.length, Open:0, 'In Progress':0, Closed:0 }; tickets.forEach(t => counts[t.status]++); $('#metrics').innerHTML = Object.entries(counts).map(([name,value]) => `<div class="metric"><span>${name}</span><strong>${value}</strong></div>`).join(''); }
function open(id) { $(`#${id}`).classList.remove('hidden'); }
function close(id) { $(`#${id}`).classList.add('hidden'); }
function toast(text) { const el=$('#toast');el.textContent=text;el.classList.remove('hidden');setTimeout(()=>el.classList.add('hidden'),3000); }
async function showDetail(id) {
  const t = await request(`/api/tickets/${id}`);
  $('#detailContent').innerHTML = `<div class="detail-head"><div><p class="eyebrow">${t.ticket_id}</p><h2>${escapeHtml(t.subject)}</h2></div>${badge(t.status)}</div><p class="meta"><strong>${escapeHtml(t.customer_name)}</strong> · ${escapeHtml(t.customer_email)}<br>Created ${formatDate(t.created_at)}</p><div class="description">${escapeHtml(t.description)}</div><div class="notes"><strong>Activity</strong>${t.notes.length ? t.notes.map(n=>`<div class="note">${escapeHtml(n.note_text)}<small>${formatDate(n.created_at)}</small></div>`).join('') : '<p class="subtle">No internal notes yet.</p>'}</div><form class="update-box" id="updateForm"><div class="update-grid"><label>Status<select name="status">${['Open','In Progress','Closed'].map(s=>`<option ${s===t.status?'selected':''}>${s}</option>`).join('')}</select></label><label>Add internal note<textarea name="notes" rows="2" placeholder="Leave a note for your team"></textarea></label></div><p class="form-error" id="updateError"></p><button class="primary" type="submit">Save changes</button></form>`;
  $('#updateForm').onsubmit = async e => { e.preventDefault(); const form = new FormData(e.currentTarget); try { await request(`/api/tickets/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(Object.fromEntries(form)) }); toast('Ticket updated'); await loadTickets(); showDetail(id); } catch (err) { $('#updateError').textContent=err.message; } };
  open('detailModal');
}
let searchTimer; $('#search').oninput = () => { clearTimeout(searchTimer); searchTimer=setTimeout(loadTickets,250); }; $('#statusFilter').onchange=loadTickets;
$('#newTicketButton').onclick=()=>open('createModal'); document.querySelector('nav a[href="#new-ticket"]').onclick=e=>{e.preventDefault();open('createModal')};
document.addEventListener('click', e => { const row=e.target.closest('[data-ticket]'); if(row)showDetail(row.dataset.ticket); const closer=e.target.closest('[data-close]'); if(closer)close(closer.dataset.close); if(e.target.classList.contains('modal'))close(e.target.id); });
$('#createForm').onsubmit=async e=>{e.preventDefault();const form=new FormData(e.currentTarget);try{const result=await request('/api/tickets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(form))});close('createModal');e.currentTarget.reset();toast(`${result.ticket_id} created`);await loadTickets();showDetail(result.ticket_id);}catch(err){$('#createError').textContent=err.message;}};
loadTickets().catch(err=>toast(err.message));
