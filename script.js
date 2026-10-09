
function toggleMenu() {
    const restMenu = document.querySelector('.rest');
    restMenu.classList.toggle('active');
}


document.querySelectorAll('.rest a').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelector('.rest').classList.remove('active');
    });
});

document.addEventListener('click', (e) => {
    const nav = document.querySelector('nav');
    const restMenu = document.querySelector('.rest');

    if (!nav.contains(e.target)) {
        restMenu.classList.remove('active');
    }
});

const openingHours = {
    0: null,
    1: [9, 20],
    2: [9, 20],
    3: [9, 20],
    4: [9, 20],
    5: [9, 20],
    6: [10, 18]
};

const dateInput = document.getElementById('date');
const timeSelect = document.getElementById('time');
const dateNote = document.getElementById('dateNote');


function twoDigits(number) {
    return String(number).padStart(2, '0');
}

const today = new Date();
dateInput.min = today.getFullYear() + '-' + twoDigits(today.getMonth() + 1) + '-' + twoDigits(today.getDate());


function formatTime(totalMinutes) {
    const hour24 = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    return twoDigits(hour12) + ':' + twoDigits(minutes) + ' ' + period;
}

function fillTimeSlots() {
    dateNote.textContent = '';

    if (!dateInput.value) {
        timeSelect.innerHTML = '<option value="" disabled selected>Choose a date first</option>';
        return;
    }

    const weekday = new Date(dateInput.value + 'T00:00').getDay();
    const hours = openingHours[weekday];

    if (hours === null) {
        dateNote.textContent = 'We are closed on Sundays. Please pick another day.';
        dateInput.value = '';
        timeSelect.innerHTML = '<option value="" disabled selected>Choose a date first</option>';
        return;
    }

    timeSelect.innerHTML = '<option value="" disabled selected>Select a time</option>';

    const firstSlot = hours[0] * 60;
    const lastSlot = hours[1] * 60 - 60;   

    for (let minutes = firstSlot; minutes <= lastSlot; minutes += 30) {
        const option = document.createElement('option');
        option.value = twoDigits(Math.floor(minutes / 60)) + ':' + twoDigits(minutes % 60);
        option.textContent = formatTime(minutes);
        timeSelect.appendChild(option);
    }
}

dateInput.addEventListener('change', fillTimeSlots);

const BACKEND_URL = 'https://backend-2-0-zwme.onrender.com';

function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.classList.toggle('open');

    document.getElementById('chatBubble').classList.toggle('chat-open');

    if (chatWindow.classList.contains('open')) {
        loadHistory();
        document.getElementById('chatInput').focus();
    }
}

function addMessage(role, content) {
    const chatMessages = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    div.textContent = content;   
    chatMessages.appendChild(div);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'chat-msg assistant typing-indicator';
    div.id = 'typingIndicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

async function loadHistory() {
    if (!BACKEND_URL) return;  

    try {
        const res = await fetch(`${BACKEND_URL}/history`, {
            credentials: 'include'
        });
        const data = await res.json();

        if (data.messages.length > 0) {
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = '';
            data.messages.forEach(msg => addMessage(msg.role, msg.content));
        }
    } catch (err) {
        console.error('Could not load history:', err);
    }
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    addMessage('user', text);
    input.value = '';

    if (!BACKEND_URL) {
        addMessage('assistant', 'The chatbot is not connected yet. Please use the booking form on this page for now.');
        return;
    }

    showTypingIndicator();

    try {
        const res = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ message: text })
        });
        const data = await res.json();

        hideTypingIndicator();

        if (!res.ok || data.error) {
            addMessage('assistant', data.error || 'Something went wrong. Please try again.');
            return;
        }

        addMessage('assistant', data.response);

    } catch (err) {
        hideTypingIndicator();
        console.error('Send failed:', err);
        addMessage('assistant', 'Could not reach the server. Please check your connection.');
    }
}

function handleKey(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}