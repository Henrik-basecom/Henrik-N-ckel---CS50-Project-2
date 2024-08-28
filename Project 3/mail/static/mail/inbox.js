document.addEventListener('DOMContentLoaded', function () {
  // Use buttons to toggle between views
  document
    .querySelector('#inbox')
    .addEventListener('click', () => load_mailbox('inbox'));
  document
    .querySelector('#sent')
    .addEventListener('click', () => load_mailbox('sent'));
  document
    .querySelector('#archived')
    .addEventListener('click', () => load_mailbox('archive'));
  document
    .querySelector('#compose')
    .addEventListener('click', () => compose_email());

  // By default, load the inbox
  load_mailbox('inbox');

  // Add mail buttons
  document.querySelector('#btn-rply').addEventListener('click', event_rply);
  document
    .querySelector('#btn-archive')
    .addEventListener('click', event_archive);
  document
    .querySelector('#btn-unarchive')
    .addEventListener('click', event_unarchive);
});

function compose_email(preFill) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  const rec = document.querySelector('#compose-recipients');
  const sub = document.querySelector('#compose-subject');
  const bod = document.querySelector('#compose-body');
  rec.value = '';
  sub.value = '';
  bod.value = '';

  if (preFill) {
    rec.value = preFill.sen;
    sub.value = preFill.sub;
    bod.value = preFill.bod;
  }

  ex_compose_mail();
}

function load_mailbox(mailbox) {
  //Clear previous entries
  clear_mailbox();

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  if (mailbox === 'sent') ex_sent_mailbox();
  if (mailbox === 'inbox') ex_inbox_mailbox();
  if (mailbox === 'archive') ex_archive_mailbox();
}

function load_mail(mail_id) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  ex_load_mail(mail_id);
}

//Compose Mail
function ex_compose_mail() {
  //remove old eventlisteners
  const form = document.querySelector('#compose-form');
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', (event) => {
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    async function post() {
      let response = await fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body.replace(/^On.+?wrote:/, '').trim(),
        }),
      });
      response = await response.json();

      if (response.error) {
        alert(response.error);
        return;
      }

      load_mailbox('sent');
    }
    post();

    event.preventDefault();
  });
}

//Sent Mailbox
function ex_sent_mailbox() {
  async function get() {
    let response = await fetch('/emails/sent');
    response = await response.json();
    if (!response) return;

    response.forEach((obj) => {
      foreach_mailbox(obj);
    });
  }
  get();
}

//Inbox Mailbox
function ex_inbox_mailbox() {
  async function get() {
    let response = await fetch('/emails/inbox');
    response = await response.json();
    if (!response) return;

    response.forEach((obj) => {
      foreach_mailbox(obj, true);
    });
  }
  get();
}

//Archive Mailbox
function ex_archive_mailbox() {
  async function get() {
    let response = await fetch('/emails/archive');
    response = await response.json();
    if (!response) return;

    response.forEach((obj) => {
      foreach_mailbox(obj, true);
    });
  }
  get();
}

//Load Mail
function ex_load_mail(mail_id) {
  async function get() {
    let response = await fetch(`/emails/${mail_id}`);
    response = await response.json();
    if (!response) return;

    document.querySelector('#email-view h2').innerHTML = response.subject;
    document.querySelector(
      '.mail-row-view h6'
    ).innerHTML = `From: ${response.sender}`;
    document.querySelector('#mail_timestamp').innerHTML = response.timestamp;
    document.querySelector('#mail_recipients').innerHTML = `To: ${
      response.recipients[0]
    }${response.recipients.length > 1 ? ', ...' : ''}`;
    document.querySelector('.body-text').innerHTML = response.body;

    document.querySelector('#btn-archive').dataset.id = mail_id;
    document.querySelector('#btn-unarchive').dataset.id = mail_id;

    const btn_rply = document.querySelector('#btn-rply');
    btn_rply.dataset.sen = response.sender;
    btn_rply.dataset.sub = response.subject;
    btn_rply.dataset.tim = response.timestamp;
    btn_rply.dataset.bod = response.body;

    async function markRead() {
      let response2 = await fetch(`/emails/${mail_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true,
        }),
      });
    }
    markRead();
  }
  get();
}

//Helper Functions
function clear_mailbox() {
  document.querySelector('#emails-view').innerHTML = '';
}

//Add functionality to reply button
function event_rply(event) {
  const preFill = {
    sen: this.dataset.sen,
    sub: /Re:/.test(this.dataset.sub)
      ? this.dataset.sub
      : `Re: ${this.dataset.sub}`,
    bod: `On: ${this.dataset.tim} ${this.dataset.sen} wrote: ${this.dataset.bod} >>\n\n`,
  };

  compose_email(preFill);
}

//Add functionality to archive button
function event_archive(event) {
  const mail_id = this.dataset.id;
  async function archive() {
    let response = await fetch(`/emails/${mail_id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: true,
      }),
    });
    console.log('ARCHIVED: ', response.status);
    if (response.status != 204) return;
    load_mailbox('inbox');
  }
  archive();
}

//Add functionality to unarchive button
function event_unarchive(event) {
  const mail_id = this.dataset.id;
  async function archive() {
    let response = await fetch(`/emails/${mail_id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: false,
      }),
    });
    console.log('ARCHIVED: ', response.status);
    if (response.status != 204) return;
    load_mailbox('inbox');
  }
  archive();
}

//Take sql obj and create/append a new node to the mail view
function foreach_mailbox(obj, el) {
  const div = document.createElement('div');
  div.style.border = '1px solid #000000';
  div.style.marginBottom = '5px';
  div.style.padding = '5px';
  const temp = el
    ? `From: "${obj.sender}"`
    : `To: "${obj.recipients[0]}${obj.recipients.length > 1 ? ', ...' : ''}”`;
  div.innerHTML = `Subject: "${obj.subject}" ${temp} At: "${obj.timestamp}"`;

  if (el) {
    div.addEventListener('click', (event) => {
      load_mail(obj.id);
    });
    div.style.cursor = 'pointer';
    if (obj.read) div.style.background = '#d3d3d3';
  }

  document.querySelector('#emails-view').appendChild(div);
}
