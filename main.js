// View Management
const views = {
    home: document.getElementById('home-view'),
    upload: document.getElementById('upload-view'),
    verify: document.getElementById('verify-view')
};

const navLinks = {
    home: document.getElementById('nav-home'),
    upload: document.getElementById('nav-upload'),
    verify: document.getElementById('nav-verify')
};

function switchView(viewName) {
    Object.values(views).forEach(v => v.classList.add('hidden'));
    Object.values(navLinks).forEach(l => l.classList.remove('active'));

    views[viewName].classList.remove('hidden');
    navLinks[viewName].classList.add('active');
}

navLinks.home.addEventListener('click', () => switchView('home'));
navLinks.upload.addEventListener('click', () => switchView('upload'));
navLinks.verify.addEventListener('click', () => switchView('verify'));

// Hashing Utility
async function hashFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

// Upload Logic
const uploadForm = document.getElementById('upload-form');
const dropZoneUpload = document.getElementById('drop-zone-upload');
const certFileInput = document.getElementById('cert-file');
const fileNameDisplay = document.getElementById('file-name-display');

dropZoneUpload.addEventListener('click', () => certFileInput.click());
certFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        fileNameDisplay.textContent = e.target.files[0].name;
    }
});

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const resultBox = document.getElementById('upload-result');
    resultBox.className = 'result-box';
    resultBox.textContent = 'Processing...';
    resultBox.style.display = 'block';

    try {
        const file = certFileInput.files[0];
        if (!file) throw new Error('Please select a certificate file');

        const hash = await hashFile(file);

        const certData = {
            studentName: document.getElementById('student-name').value,
            registerId: document.getElementById('register-id').value,
            certName: document.getElementById('cert-name').value,
            issueDate: document.getElementById('issue-date').value,
            issuerName: document.getElementById('issuer-name').value,
            fileHash: hash
        };

        const response = await fetch(`${API_BASE}/certificates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(certData)
        });

        const result = await response.json();

        if (response.ok) {
            resultBox.className = 'result-box result-success';
            resultBox.innerHTML = `<strong>Success!</strong> Certificate recorded reliably.`;
            uploadForm.reset();
            fileNameDisplay.textContent = 'Click or drag & drop certificate here';
        } else {
            throw new Error(result.message || 'Failed to record certificate');
        }
    } catch (err) {
        resultBox.className = 'result-box result-error';
        resultBox.textContent = err.message;
    }
});

// Verify Logic
const dropZoneVerify = document.getElementById('drop-zone-verify');
const verifyFileInput = document.getElementById('verify-file');
const verifyFileDisplay = document.getElementById('verify-file-display');
const btnVerify = document.getElementById('btn-verify');

dropZoneVerify.addEventListener('click', () => verifyFileInput.click());
verifyFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        verifyFileDisplay.textContent = e.target.files[0].name;
    }
});

btnVerify.addEventListener('click', async () => {
    const resultBox = document.getElementById('verify-result');
    resultBox.className = 'result-box';
    resultBox.innerHTML = 'Verifying authenticity...';
    resultBox.style.display = 'block';

    try {
        const file = verifyFileInput.files[0];
        if (!file) throw new Error('Please select a file to verify');

        const hash = await hashFile(file);

        const response = await fetch(`${API_BASE}/certificates/${hash}`);
        const data = await response.json();

        if (response.ok) {
            resultBox.className = 'result-box result-success';
            resultBox.innerHTML = `
                <div style="text-align: left;">
                    <h3 style="margin-bottom: 0.5rem;">✓ Certificate Verified</h3>
                    <p><strong>Student:</strong> ${data.studentName}</p>
                    <p><strong>Reg ID:</strong> ${data.registerId}</p>
                    <p><strong>Certificate:</strong> ${data.certName}</p>
                    <p><strong>Issued By:</strong> ${data.issuerName}</p>
                    <p><strong>Date:</strong> ${data.issueDate}</p>
                </div>
            `;
        } else {
            resultBox.className = 'result-box result-error';
            resultBox.innerHTML = `
                <h3 style="margin-bottom: 0.5rem;">✗ Verification Failed</h3>
                <p>This certificate was not found in our records. It may have been tampered with or was never issued.</p>
            `;
        }
    } catch (err) {
        resultBox.className = 'result-box result-error';
        resultBox.textContent = err.message;
    }
});
