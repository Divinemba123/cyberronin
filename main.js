document.addEventListener('DOMContentLoaded', () => {
    // Custom Cursor Logic
    const cursor = document.getElementById('custom-cursor');
    const dot = cursor.querySelector('.cursor-dot');
    const ring = cursor.querySelector('.cursor-ring');

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Instant dot movement
        dot.style.left = `${mouseX}px`;
        dot.style.top = `${mouseY}px`;
    });

    // Lag effect for ring
    const animateCursor = () => {
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;

        ring.style.left = `${ringX}px`;
        ring.style.top = `${ringY}px`;

        requestAnimationFrame(animateCursor);
    };
    animateCursor();

    const interactables = document.querySelectorAll('button, a, input, .checkbox-container');
    interactables.forEach(el => {
        el.addEventListener('mouseenter', () => {
            dot.classList.add('inner-dot-active');
            ring.classList.add('outer-ring-active');
        });
        el.addEventListener('mouseleave', () => {
            dot.classList.remove('inner-dot-active');
            ring.classList.remove('outer-ring-active');
        });
    });

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });

    // Close menu on link click
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('active');
        });
    });

    // Whitelist Modal Logic
    const modal = document.getElementById('whitelist-modal');
    const openBtn = document.getElementById('open-whitelist');
    const closeBtn = document.querySelector('.close-modal');

    let gameActive = false;
    let score = 0;
    let gameLoopId = null;

    window.openWhitelist = () => {
        modal.classList.add('active');
        startProtocolChallenge();
    };

    const closeModal = () => {
        modal.classList.remove('active');
        gameActive = false;
        if (gameLoopId) {
            cancelAnimationFrame(gameLoopId);
            gameLoopId = null;
        }
    };

    openBtn.addEventListener('click', openWhitelist);
    closeBtn.addEventListener('click', closeModal);

    // Protocol Challenge (Dino Game)
    const canvas = document.getElementById('dino-canvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('current-score');
    const hint = document.querySelector('.game-hint');
    const gameOverUI = document.getElementById('game-over-ui');

    let player = { x: 50, y: 150, w: 20, h: 30, dy: 0, jumpForce: -10, grounded: false };
    let obstacles = [];
    let gameSpeed = 6;
    let frame = 0;

    window.startProtocolChallenge = () => {
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        score = 0;
        obstacles = [];
        gameSpeed = 6;
        player.y = 150;
        player.dy = 0;
        gameActive = true;
        hint.style.display = 'block';
        gameOverUI.style.display = 'none';
        goToStep('game');
        gameLoopId = requestAnimationFrame(gameLoop);
    };

    function gameLoop() {
        if (!gameActive) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Background Grid
        ctx.strokeStyle = 'rgba(215, 38, 56, 0.1)';
        ctx.lineWidth = 1;
        for(let i=0; i<canvas.width; i+=20) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
        }

        // Player Physics
        player.dy += 0.8; // Heavy Gravity
        player.y += player.dy;
        
        if (player.y + player.h > canvas.height - 20) {
            player.y = canvas.height - 20 - player.h;
            player.dy = 0;
            player.grounded = true;
        }

        // Draw Animated Pixel Dino (BitMap)
        const pSize = 3; 
        const isRunning = player.grounded && (Math.floor(frame / 6) % 2 === 0);
        
        const dinoMap = [
            [0,0,0,0,1,1,0,0,0],
            [0,0,0,1,1,1,1,0,0],
            [0,0,1,1,1,0,1,1,0],
            [0,0,1,1,1,1,1,1,1],
            [0,0,1,1,1,1,1,1,0],
            [0,1,1,1,1,1,1,0,0],
            [1,1,1,1,1,1,1,0,0],
            [1,1,1,1,1,1,1,0,0],
            [0,0,1,1,1,0,1,1,0],
            isRunning ? [0,0,1,1,0,0,0,1,1] : [0,0,0,1,1,0,1,1,0] // Simple Leg Animation
        ];

        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.fillStyle = '#D72638';
        ctx.shadowBlur = 0;

        dinoMap.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (pixel) {
                    ctx.fillRect(x * pSize, y * pSize, pSize, pSize);
                }
            });
        });
        ctx.restore();
        
        // Spawn Obstacles
        if (frame % 70 === 0) {
            const types = [
                { w: 15, h: 30, color: '#E28413' }, // Standard
                { w: 25, h: 20, color: '#ff0055' }, // Wide
                { w: 10, h: 45, color: '#ffffff' }  // Tall
            ];
            const type = types[Math.floor(Math.random() * types.length)];
            obstacles.push({ x: canvas.width, y: canvas.height - 20 - type.h, ...type });
        }

        // Draw & Move Obstacles
        obstacles.forEach((obs, index) => {
            obs.x -= gameSpeed;
            ctx.fillStyle = obs.color;
            ctx.shadowColor = obs.color;
            ctx.shadowBlur = 5;

            // Draw Tank Body
            ctx.fillRect(obs.x, obs.y + obs.h * 0.4, obs.w, obs.h * 0.6);
            // Draw Turret
            ctx.fillRect(obs.x + obs.w * 0.2, obs.y + obs.h * 0.1, obs.w * 0.6, obs.h * 0.4);
            // Draw Barrel
            ctx.fillRect(obs.x - 5, obs.y + obs.h * 0.2, 10, 4);

            // Collision
            if (player.x < obs.x + obs.w &&
                player.x + (pSize * 8) > obs.x &&
                player.y < obs.y + obs.h &&
                player.y + (pSize * 10) > obs.y) {
                // Game Over
                gameActive = false;
                gameOverUI.style.display = 'block';
            }

            if (obs.x + obs.w < 0) {
                obstacles.splice(index, 1);
            }
        });

        score++;
        scoreDisplay.innerText = score;
        
        // Goal Reached
        if (score >= 201) {
            gameActive = false;
            scoreDisplay.innerText = "201: CREATED";
            scoreDisplay.style.color = "#00ff00";
            setTimeout(() => {
                goToStep(1);
            }, 1000);
            return;
        }

        frame++;
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault(); // Prevent scrolling & button focus trigger
            
            if (!gameActive && modal.classList.contains('active')) {
                // Allow Space to start/retry
                if (document.getElementById('game-step').classList.contains('active')) {
                    startProtocolChallenge();
                }
            } else if (player.grounded && gameActive) {
                // Jump
                player.dy = player.jumpForce;
                player.grounded = false;
                hint.style.display = 'none';
            }
        }
    });

    // Step Management
    window.goToStep = (stepNumber) => {
        const steps = document.querySelectorAll('.step');
        steps.forEach(s => s.classList.remove('active'));
        
        if(stepNumber === 'game') {
            const gameStep = document.getElementById('game-step');
            if(gameStep) gameStep.classList.add('active');
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
            return;
        }

        if(stepNumber === 'success') {
            const successStep = document.getElementById('step-success');
            if(successStep) successStep.classList.add('active');
            return;
        }

        const targetStep = document.getElementById(`step-${stepNumber}`);
        if(targetStep) targetStep.classList.add('active');
    };

    window.validateHandleAndContinue = () => {
        const handle = document.getElementById('twitter-handle').value.trim();
        if (!handle) {
            alert('PROTOCOL ERROR: Digital identity (Twitter handle) must be established.');
            return;
        }
        goToStep(2);
    };

    // Task Validation (Step 2)
    const setupTasks = () => {
        const tasks = [
            document.getElementById('task-1'),
            document.getElementById('task-2'),
            document.getElementById('task-3')
        ];
        const verifyBtn = document.getElementById('verify-btn');

        if (!tasks[0] || !verifyBtn) return;

        tasks.forEach(task => {
            task.addEventListener('change', () => {
                const allChecked = tasks.every(t => t && t.checked);
                verifyBtn.disabled = !allChecked;
            });
        });
    };
    
    // Call setup once or when entering step 2
    setupTasks();

    // Form Submission
    window.submitWhitelist = async () => {
        const handle = document.getElementById('twitter-handle').value;
        const address = document.getElementById('eth-address').value;
        const referral = document.getElementById('referral').value;
        const submitBtn = document.querySelector('#step-3 .next-btn');
        
        if(!address || address.length < 20) {
            alert('PROTOCOL ERROR: Invalid wallet address detected.');
            return;
        }

        // Simulate Loading State
        const originalText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerText = "UPLOADING DATA...";

        const data = {
            twitter: handle,
            wallet: address,
            referral: referral,
            timestamp: new Date().toISOString(),
            status: "Whitelisted"
        };

        // Real API Submission to Local Server
        try {
            const response = await fetch('http://localhost:5000/api/whitelist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                alert(`PROTOCOL ERROR: ${result.error || 'Transmission failed'}`);
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
                return;
            }
        } catch (error) {
            console.error("Server currently unreachable:", error);
            alert("PROTOCOL FAILURE: The Undergrid is currently offline. Please try again later.");
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
            return;
        }

        console.log("Transmission Sent:", data);
        
        document.getElementById('display-handle').innerText = handle || 'WARRIOR';
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
        
        goToStep('success');
    };

    window.closeModal = closeModal;

    // Scroll Fade Animation
    const fadeElements = document.querySelectorAll('.fade-in');
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    fadeElements.forEach(el => observer.observe(el));

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            faqItems.forEach(f => f.classList.remove('active'));
            if (!isActive) item.classList.add('active');
        });
    });

    // Dossier Slider Logic
    const slides = document.querySelectorAll('.slide');
    const nextBtn = document.querySelector('.next-slide');
    const prevBtn = document.querySelector('.prev-slide');
    const clanEl = document.getElementById('current-clan');
    const rankEl = document.getElementById('current-rank');
    const statusEl = document.getElementById('current-status');
    
    let currentSlide = 0;

    const updateDossier = (index) => {
        const slide = slides[index];
        slides.forEach(s => s.classList.remove('active'));
        slide.classList.add('active');

        // Update Text with typing effect simulation
        clanEl.innerText = slide.dataset.clan;
        rankEl.innerText = slide.dataset.rank;
        statusEl.innerText = slide.dataset.status;

        // Reset Animations
        const scanner = document.querySelector('.scanner-bar');
        const overlay = document.querySelector('.dossier-overlay');
        
        [scanner, overlay].forEach(el => {
            el.style.animation = 'none';
            el.offsetHeight; 
            el.style.animation = null;
        });
    };

    nextBtn.addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % slides.length;
        updateDossier(currentSlide);
    });

    prevBtn.addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        updateDossier(currentSlide);
    });

    // Auto-advance
    setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        updateDossier(currentSlide);
    }, 6000);

    // Live Data Simulation
    setInterval(() => {
        document.getElementById('block-num').innerText = `#${Math.floor(Math.random() * 10000) + 800000}...`;
        document.getElementById('latency').innerText = `${Math.floor(Math.random() * 20) + 10}ms`;
        document.getElementById('sync-rate').innerText = `${(98 + Math.random()).toFixed(2)}%`;
    }, 3000);
});
