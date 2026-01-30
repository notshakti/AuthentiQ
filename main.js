// ============================================
// AUTHENTIQ - PREMIUM UI INTERACTIONS
// ============================================

// ============================================
// API CONFIG (SINGLE SOURCE OF TRUTH)
// ============================================

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

// ============================================
// VIEW MANAGEMENT
// ============================================
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

let currentFormStep = 1;
let generatedHash = '';

function switchView(viewName) {
    Object.values(views).forEach(v => {
        v.classList.add('hidden');
        v.style.opacity = '0';
    });
    
    Object.values(navLinks).forEach(l => l.classList.remove('active'));
    
    setTimeout(() => {
        views[viewName].classList.remove('hidden');
        views[viewName].style.opacity = '1';
        navLinks[viewName].classList.add('active');
        
        if (viewName === 'upload') {
            resetFormSteps();
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 150);
}

navLinks.home.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('home');
});

navLinks.upload.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('upload');
});

navLinks.verify.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('verify');
});

const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});

// ============================================
// FORM STEP MANAGEMENT
// ============================================

function resetFormSteps() {
    currentFormStep = 1;
    updateProgressIndicator(1);
    showFormStep(1);
}

function nextFormStep() {
    if (currentFormStep < 3) {
        if (currentFormStep === 1) {
            const requiredFields = ['student-name', 'register-id', 'cert-name', 'issue-date', 'issuer-name'];
            let isValid = true;
            
            requiredFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = 'var(--error)';
                    setTimeout(() => {
                        field.style.borderColor = '';
                    }, 2000);
                }
            });
            
            if (!isValid) {
                return;
            }
            
            updateCertificatePreview();
        } else if (currentFormStep === 2) {
            const file = document.getElementById('cert-file').files[0];
            if (!file) {
                alert('Please upload a certificate file');
                return;
            }
            
            computeHashPreview(file);
        }
        
        currentFormStep++;
        updateProgressIndicator(currentFormStep);
        showFormStep(currentFormStep);
    }
}

function prevFormStep() {
    if (currentFormStep > 1) {
        currentFormStep--;
        updateProgressIndicator(currentFormStep);
        showFormStep(currentFormStep);
    }
}

function showFormStep(step) {
    for (let i = 1; i <= 3; i++) {
        const stepEl = document.getElementById(`form-step-${i}`);
        if (i === step) {
            stepEl.classList.remove('hidden');
        } else {
            stepEl.classList.add('hidden');
        }
    }
}

function updateProgressIndicator(activeStep) {
    const steps = document.querySelectorAll('.progress-step');
    steps.forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNum < activeStep) {
            step.classList.add('completed');
        } else if (stepNum === activeStep) {
            step.classList.add('active');
        }
    });
}

window.nextFormStep = nextFormStep;
window.prevFormStep = prevFormStep;

// ============================================
// CERTIFICATE PREVIEW
// ============================================

function updateCertificatePreview() {
    const studentName = document.getElementById('student-name').value || '—';
    const registerId = document.getElementById('register-id').value || '—';
    const certName = document.getElementById('cert-name').value || '—';
    const issuerName = document.getElementById('issuer-name').value || '—';
    const issueDate = document.getElementById('issue-date').value || '—';
    
    document.getElementById('preview-student').textContent = studentName;
    document.getElementById('preview-register').textContent = registerId;
    document.getElementById('preview-cert').textContent = certName;
    document.getElementById('preview-institution').textContent = issuerName;
    
    if (issueDate !== '—') {
        const date = new Date(issueDate);
        document.getElementById('preview-date').textContent = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    } else {
        document.getElementById('preview-date').textContent = '—';
    }
    
    const previewBadge = document.getElementById('preview-status');
    if (studentName !== '—' && registerId !== '—' && certName !== '—') {
        previewBadge.textContent = 'Ready';
        previewBadge.style.background = 'rgba(139, 92, 246, 0.2)';
        previewBadge.style.borderColor = 'rgba(139, 92, 246, 0.3)';
        previewBadge.style.color = 'var(--text-accent)';
    } else {
        previewBadge.textContent = 'Draft';
        previewBadge.style.background = 'var(--glass-bg)';
        previewBadge.style.borderColor = 'var(--glass-border)';
        previewBadge.style.color = 'var(--text-secondary)';
    }
}

['student-name', 'register-id', 'cert-name', 'issuer-name', 'issue-date'].forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
        field.addEventListener('input', updateCertificatePreview);
        field.addEventListener('change', updateCertificatePreview);
    }
});

// ============================================
// HASH PREVIEW
// ============================================

async function computeHashPreview(file) {
    const hashPreview = document.getElementById('hash-preview');
    const hashText = hashPreview.querySelector('.hash-text');
    const copyBtn = document.getElementById('btn-copy-hash');
    
    hashText.textContent = 'Computing hash...';
    copyBtn.style.display = 'none';
    
    try {
        const hash = await hashFile(file);
        if (!hash || hash.length !== 64) {
            throw new Error('Invalid hash computed');
        }
        generatedHash = hash;
        hashText.textContent = hash.substring(0, 32) + '...';
        copyBtn.style.display = 'flex';
    } catch (err) {
        hashText.textContent = 'Error computing hash';
        generatedHash = '';
        console.error(err);
    }
}

function copyHashToClipboard() {
    if (generatedHash) {
        navigator.clipboard.writeText(generatedHash).then(() => {
            const btn = document.getElementById('btn-copy-hash');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
            btn.style.color = 'var(--success)';
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.color = '';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy hash:', err);
        });
    }
}

window.copyHashToClipboard = copyHashToClipboard;

// ============================================
// HASHING UTILITY
// ============================================

async function hashFile(file) {
    if (!file) {
        throw new Error('File is required');
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (!hash || hash.length !== 64) {
        throw new Error('Hash computation failed: invalid length');
    }
    
    return hash;
}

// ============================================
// DRAG & DROP UTILITIES
// ============================================

function setupDragAndDrop(dropZone, fileInput, displayElement) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            fileInput.files = files;
            handleFileSelect(fileInput, displayElement);
            
            if (currentFormStep === 2 && fileInput.id === 'cert-file') {
                computeHashPreview(files[0]);
            }
        }
    }, false);

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleFileSelect(fileInput, displayElement) {
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        displayElement.textContent = file.name;
        
        displayElement.style.color = 'var(--text-accent)';
        setTimeout(() => {
            displayElement.style.color = '';
        }, 2000);
    }
}

// ============================================
// UPLOAD CERTIFICATE LOGIC
// ============================================

const uploadForm = document.getElementById('upload-form');
const dropZoneUpload = document.getElementById('drop-zone-upload');
const certFileInput = document.getElementById('cert-file');
const fileNameDisplay = document.getElementById('file-name-display');

setupDragAndDrop(dropZoneUpload, certFileInput, fileNameDisplay);

certFileInput.addEventListener('change', (e) => {
    handleFileSelect(e.target, fileNameDisplay);
    if (currentFormStep === 2 && e.target.files[0]) {
        computeHashPreview(e.target.files[0]);
    }
});

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const resultBox = document.getElementById('upload-result');
    const submitBtn = uploadForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    resultBox.className = 'result-box';
    resultBox.innerHTML = '<div style="display: flex; align-items: center; gap: 0.5rem;"><div class="spinner"></div> Processing certificate...</div>';
    resultBox.classList.add('show');
    resultBox.style.display = 'block';
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Processing...</span>';
    
    try {
        const fileInput = document.getElementById('cert-file');
        const file = fileInput.files[0];
        
        if (!file) {
            throw new Error('Please select a certificate file');
        }

        // Log file details for debugging
        console.log('📄 File selected:', {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified).toISOString()
        });

        if (file.size > 10 * 1024 * 1024) {
            throw new Error('File size exceeds 10MB limit');
        }

        resultBox.innerHTML = '<div style="display: flex; align-items: center; gap: 0.5rem;"><div class="spinner"></div> Computing cryptographic hash...</div>';
        
        // Ensure we're reading a fresh copy of the file
        const hash = await hashFile(file);
        
        console.log('🔐 Generated hash:', hash);
        console.log('🔐 Hash length:', hash.length);
        console.log('🔐 Hash format valid:', /^[a-f0-9]{64}$/i.test(hash));
        
        if (!hash || hash.length !== 64 || !/^[a-f0-9]{64}$/i.test(hash)) {
            throw new Error('Hash computation failed: invalid hash format');
        }

        generatedHash = '';
        
        const certData = {
            studentName: document.getElementById('student-name').value.trim(),
            registerId: document.getElementById('register-id').value.trim(),
            certName: document.getElementById('cert-name').value.trim(),
            issueDate: document.getElementById('issue-date').value.trim(),
            issuerName: document.getElementById('issuer-name').value.trim(),
            fileHash: hash
        };

        console.log('📤 Uploading certificate:', {
            studentName: certData.studentName,
            registerId: certData.registerId,
            certName: certData.certName,
            fileName: file.name,
            fileSize: file.size,
            hash: hash.substring(0, 16) + '...',
            fullHash: hash
        });

        resultBox.innerHTML = '<div style="display: flex; align-items: center; gap: 0.5rem;"><div class="spinner"></div> Recording certificate...</div>';

        const requestBody = JSON.stringify(certData);
        console.log('📤 Sending request with hash:', certData.fileHash);

        const response = await fetch(`${API_BASE}/certificates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody
        });

        const result = await response.json();
        console.log('📥 Server response:', result);

        if (response.ok) {
            resultBox.className = 'result-box result-success show';
            resultBox.innerHTML = `
                <h3>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Certificate Issued Successfully
                </h3>
                <p><strong>Hash:</strong> <code style="font-size: 0.875rem; background: rgba(0,0,0,0.2); padding: 0.25rem 0.5rem; border-radius: 4px;">${hash.substring(0, 16)}...</code></p>
                <p style="margin-top: 0.5rem;">Your certificate has been cryptographically sealed and recorded.</p>
            `;
            
            document.getElementById('preview-status').textContent = 'Issued';
            document.getElementById('preview-status').style.background = 'rgba(34, 197, 94, 0.2)';
            document.getElementById('preview-status').style.borderColor = 'rgba(34, 197, 94, 0.3)';
            document.getElementById('preview-status').style.color = 'var(--success)';
            
            addActivityLogItem('issued', certData.studentName, certData.certName, hash);
            
            generatedHash = '';
            
            setTimeout(() => {
                // Completely reset the form and file input
                uploadForm.reset();
                const fileInput = document.getElementById('cert-file');
                if (fileInput) {
                    fileInput.value = '';
                }
                fileNameDisplay.textContent = 'Click or drag & drop certificate here';
                resetFormSteps();
                updateCertificatePreview();
                generatedHash = '';
                console.log('✅ Form reset complete - ready for next upload');
            }, 3000);
            
            resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            throw new Error(result.message || 'Failed to record certificate');
        }
    } catch (err) {
        generatedHash = '';
        console.error('❌ Upload error:', err);
        resultBox.className = 'result-box result-error show';
        resultBox.innerHTML = `
            <h3>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Error
            </h3>
            <p>${err.message}</p>
        `;
        
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
});

// ============================================
// VERIFY CERTIFICATE LOGIC
// ============================================

const dropZoneVerify = document.getElementById('drop-zone-verify');
const verifyInput = document.getElementById('verify-file');
const verifyFileDisplay = document.getElementById('verify-file-display');
const verifyButton = document.getElementById('btn-verify');
const verifyResult = document.getElementById('verify-result');

if (dropZoneVerify && verifyInput && verifyFileDisplay) {
    setupDragAndDrop(dropZoneVerify, verifyInput, verifyFileDisplay);
    
    verifyInput.addEventListener('change', (e) => {
        handleFileSelect(e.target, verifyFileDisplay);
    });
}

verifyButton.addEventListener('click', async () => {
    verifyResult.className = 'result-box show';
    verifyResult.innerHTML = `
        <div class="spinner"></div>
        <p>Verifying certificate...</p>
    `;

    try {
        const file = verifyInput.files[0];
        if (!file) {
            throw new Error('Please select a file to verify');
        }

        const hash = await hashFile(file);
        
        if (!hash || hash.length !== 64 || !/^[a-f0-9]{64}$/i.test(hash)) {
            throw new Error('Hash computation failed: invalid hash format');
        }
        
        console.log('🟢 HASH:', hash);

        const response = await fetch(`${API_BASE}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hash }),
        });

        const rawText = await response.text();
        console.log('RAW RESPONSE:', rawText);

        let result;
        try {
            result = JSON.parse(rawText);
        } catch {
            throw new Error('Invalid JSON from verification service');
        }

        if (!result || typeof result.status !== 'string') {
            throw new Error('Invalid response from verification service');
        }

        if (result.status === 'VERIFIED') {
            const c = result.certificate;

            verifyResult.className = 'result-box result-success show';
            verifyResult.innerHTML = `
                <h3>✅ Certificate Verified</h3>
                <p><strong>Student:</strong> ${c.studentName}</p>
                <p><strong>Register:</strong> ${c.registerNumber}</p>
                <p><strong>Certificate:</strong> ${c.certificateName}</p>
                <p><strong>Institution:</strong> ${c.institution}</p>
                <p><strong>Issue Date:</strong> ${c.issueDate}</p>
                <p><strong>Hash:</strong>
                    <code>${c.hash.substring(0, 32)}...</code>
                </p>
            `;
            
            if (typeof addActivityLogItem === 'function') {
                addActivityLogItem('verified', c.studentName, c.certificateName, c.hash);
            }
            return;
        }

        if (result.status === 'TAMPERED') {
            verifyResult.className = 'result-box result-error show';
            verifyResult.innerHTML = `
                <h3>❌ Invalid / Fake Certificate</h3>
                <p>${result.message || 'Certificate hash not found'}</p>
                <p><strong>Computed Hash:</strong></p>
                <code style="word-break: break-all">${hash}</code>
            `;
            
            if (typeof addActivityLogItem === 'function') {
                addActivityLogItem('invalid', 'Unknown', 'Unknown Certificate', hash);
            }
            return;
        }

        verifyResult.className = 'result-box result-error show';
        verifyResult.innerHTML = `
            <h3>⚠ Verification Error</h3>
            <p>${result.message || 'Verification failed'}</p>
        `;
    } catch (err) {
        console.error('VERIFY ERROR:', err);
        verifyResult.className = 'result-box result-error show';
        verifyResult.innerHTML = `
            <h3>⚠ Verification Error</h3>
            <p>${err.message}</p>
        `;
    }
});

// ============================================
// ACTIVITY LOG
// ============================================

function addActivityLogItem(type, studentName, certName, hash) {
    const activityLog = document.getElementById('activity-log');
    
    const skeleton = activityLog.querySelector('.skeleton-loader');
    if (skeleton) {
        skeleton.remove();
    }
    
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    
    let iconHTML = '';
    let badgeClass = '';
    let badgeText = '';
    let activityText = '';
    
    if (type === 'issued') {
        iconHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>';
        badgeClass = 'badge-issued';
        badgeText = 'Issued';
        activityText = `Certificate issued for ${studentName}`;
    } else if (type === 'verified') {
        iconHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        badgeClass = 'badge-verified';
        badgeText = 'Verified';
        activityText = `Certificate verified for ${studentName}`;
    } else {
        iconHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        badgeClass = 'badge-invalid';
        badgeText = 'Invalid';
        activityText = 'Certificate verification failed';
    }
    
    activityItem.innerHTML = `
        <div class="activity-icon" style="background: var(--glass-bg); color: var(--text-accent);">
            ${iconHTML}
        </div>
        <div class="activity-content">
            <div class="activity-title">${activityText}</div>
            <div class="activity-meta">${certName} • ${new Date().toLocaleTimeString()}</div>
        </div>
        <div class="activity-badge ${badgeClass}">${badgeText}</div>
    `;
    
    activityLog.insertBefore(activityItem, activityLog.firstChild);
    
    while (activityLog.children.length > 5) {
        activityLog.removeChild(activityLog.lastChild);
    }
}

function initActivityLog() {
    const activityLog = document.getElementById('activity-log');
    if (activityLog && activityLog.children.length === 0) {
    }
}

// ============================================
// ADDITIONAL UI ENHANCEMENTS
// ============================================

window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
    
    initActivityLog();
    
    if (views.upload) {
        resetFormSteps();
    }
});

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.step-card, .trust-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});
