-- Link sent_emails to research_sessions
alter table sent_emails
  add column session_id uuid references research_sessions(id) on delete set null;

create index idx_sent_emails_session on sent_emails(session_id);
