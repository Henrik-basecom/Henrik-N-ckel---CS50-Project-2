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
  const form = document.querySelector('#compose-form');
  form.addEventListener('submit', (event) => {
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    async function post() {
      let response = await fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body,
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
      const div = document.createElement('div');
      div.style.border = '1px solid #000000';
      div.style.marginBottom = '5px';
      div.style.padding = '5px';
      div.innerHTML = `Subject: "${obj.subject}" To: "${obj.recipients[0]}${
        obj.recipients.length > 1 ? ', ...' : ''
      }" At: "${obj.timestamp}"`;
      document.querySelector('#emails-view').appendChild(div);
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
      const div = document.createElement('div');
      div.style.border = '1px solid #000000';
      div.style.marginBottom = '5px';
      div.style.padding = '5px';
      if (obj.read) div.style.background = '#d3d3d3';
      div.innerHTML = `Subject: "${obj.subject}" From: "${obj.sender}" At: "${obj.timestamp}"`;

      div.addEventListener('click', (event) => {
        load_mail(obj.id);
      });

      document.querySelector('#emails-view').appendChild(div);
    });
  }
  get();
}

function ex_load_mail(mail_id) {
  async function get() {
    console.log(typeof mail_id, mail_id);
    let response = await fetch(`/emails/${mail_id}`);
    response = await response.json();
    if (!response) return;
    console.log(response);

    document.querySelector('#email-view h2').innerHTML = response.subject;
    document.querySelector('.mail-row-view h3').innerHTML = response.sender;
    document.querySelector('#mail_timestamp').innerHTML = response.timestamp;
    document.querySelector('#mail_recipients').innerHTML = response.recipients;
    document.querySelector('.body-text').innerHTML = response.body;

    document.querySelector('#btn-rply').addEventListener('click', (event) => {
      const preFill = {
        sen: response.sender,
        sub: /Re:/.test(response.subject)
          ? response.subject
          : `Re: ${response.subject}`,
        bod: `On: ${response.timestamp} ${response.sender} wrote: ${response.body}\n\n`,
      };

      compose_email(preFill);
    });
  }
  get();
}
