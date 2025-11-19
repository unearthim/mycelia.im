// Mycelial Network - Language as Living Organism
// Interactive generative art visualizing typed text as bioluminescent fungal network

const canvas = document.getElementById('mycelialCanvas');
const ctx = canvas.getContext('2d');

// Canvas setup
let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

// Application state
let isPaused = false;
let isBirdsEye = false;
let intensityMultiplier = 1;
let time = 0;
let lastKeystrokeTime = 0;
let sessionStartTime = Date.now();
let totalKeystrokes = 0;

// Camera and view
let cameraX = 0;
let cameraY = 0;
let cameraZ = 1;
let targetCameraZ = 1;

// Network data
const nodes = [];
const connections = [];
const particles = [];
const letterIndex = {}; // Track positions of each letter
let characterCount = 0;

// Sacred geometry
const geometryRings = [];
const GEOMETRY_RING_COUNT = 8;

// Colors for bioluminescence (cycling through spectrum)
const biolumColors = [
    { h: 180, s: 70, l: 60 }, // cyan
    { h: 140, s: 60, l: 55 }, // green
    { h: 280, s: 60, l: 60 }, // purple
    { h: 200, s: 50, l: 70 }  // pale white-blue
];

// Node class
class Node {
    constructor(char, x, y, velocity) {
        this.char = char;
        this.x = x;
        this.y = y;
        this.creationTime = time;
        this.velocity = velocity;
        this.size = 3 + Math.min(velocity * 2, 8);
        this.glowIntensity = 1;
        this.colorIndex = Math.floor(Math.random() * biolumColors.length);
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.002 + Math.random() * 0.001;
        this.age = 0;
    }
    
    update() {
        this.age = (time - this.creationTime) / 1000;
        // Gradually dim but never disappear
        this.glowIntensity = Math.max(0.3, 1 - this.age / 100);
    }
    
    draw() {
        this.update();
        
        const pulse = Math.sin(time * this.pulseSpeed + this.pulsePhase) * 0.2 + 0.8;
        const intensity = this.glowIntensity * pulse * intensityMultiplier;
        
        const screenX = width / 2 + (this.x - cameraX) * cameraZ;
        const screenY = height / 2 + (this.y - cameraY) * cameraZ;
        
        const color = biolumColors[this.colorIndex];
        
        // Outer glow
        const glowGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, this.size * 3 * cameraZ);
        glowGradient.addColorStop(0, `hsla(${color.h}, ${color.s}%, ${color.l}%, ${0.6 * intensity})`);
        glowGradient.addColorStop(0.5, `hsla(${color.h}, ${color.s}%, ${color.l}%, ${0.3 * intensity})`);
        glowGradient.addColorStop(1, `hsla(${color.h}, ${color.s}%, ${color.l}%, 0)`);
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size * 3 * cameraZ, 0, Math.PI * 2);
        ctx.fill();
        
        // Core node
        ctx.fillStyle = `hsla(${color.h}, ${color.s}%, ${Math.min(color.l + 20, 90)}%, ${0.9 * intensity})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size * cameraZ, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Connection class
class Connection {
    constructor(fromNode, toNode, letter) {
        this.fromNode = fromNode;
        this.toNode = toNode;
        this.letter = letter;
        this.creationTime = time;
        this.growthProgress = 0;
        this.brightness = 0.5 + Math.random() * 0.5;
        this.age = 0;
    }
    
    update() {
        this.age = (time - this.creationTime) / 1000;
        if (this.growthProgress < 1) {
            this.growthProgress += 0.05;
        }
    }
    
    draw() {
        this.update();
        
        const from = this.fromNode;
        const to = this.toNode;
        
        const fromX = width / 2 + (from.x - cameraX) * cameraZ;
        const fromY = height / 2 + (from.y - cameraY) * cameraZ;
        const toX = width / 2 + (to.x - cameraX) * cameraZ;
        const toY = height / 2 + (to.y - cameraY) * cameraZ;
        
        // Interpolate for growth animation
        const currentToX = fromX + (toX - fromX) * this.growthProgress;
        const currentToY = fromY + (toY - fromY) * this.growthProgress;
        
        const avgGlow = (from.glowIntensity + to.glowIntensity) / 2;
        const intensity = avgGlow * this.brightness * intensityMultiplier;
        
        // Shimmer effect
        const shimmer = Math.sin(time * 0.003 + this.age) * 0.2 + 0.8;
        
        const avgColorIndex = Math.floor((from.colorIndex + to.colorIndex) / 2);
        const color = biolumColors[avgColorIndex];
        
        // Draw thread with glow
        ctx.strokeStyle = `hsla(${color.h}, ${color.s}%, ${color.l}%, ${0.4 * intensity * shimmer})`;
        ctx.lineWidth = Math.max(1, 2 * cameraZ);
        ctx.lineCap = 'round';
        
        // Draw with slight curve for organic feel
        const midX = (fromX + currentToX) / 2 + (Math.random() - 0.5) * 20 * cameraZ;
        const midY = (fromY + currentToY) / 2 + (Math.random() - 0.5) * 20 * cameraZ;
        
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.quadraticCurveTo(midX, midY, currentToX, currentToY);
        ctx.stroke();
        
        // Brighter core line
        ctx.strokeStyle = `hsla(${color.h}, ${color.s}%, ${Math.min(color.l + 15, 85)}%, ${0.2 * intensity * shimmer})`;
        ctx.lineWidth = Math.max(0.5, 1 * cameraZ);
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.quadraticCurveTo(midX, midY, currentToX, currentToY);
        ctx.stroke();
    }
}

// Particle class (spores)
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.alpha = 0.8;
        this.size = 1 + Math.random() * 2;
        this.colorIndex = Math.floor(Math.random() * biolumColors.length);
        this.lifespan = 3 + Math.random() * 3;
        this.age = 0;
    }
    
    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.age += dt;
        this.alpha = Math.max(0, 0.8 * (1 - this.age / this.lifespan));
    }
    
    draw() {
        if (this.alpha <= 0) return;
        
        const screenX = width / 2 + (this.x - cameraX) * cameraZ;
        const screenY = height / 2 + (this.y - cameraY) * cameraZ;
        
        const color = biolumColors[this.colorIndex];
        
        ctx.fillStyle = `hsla(${color.h}, ${color.s}%, ${color.l}%, ${this.alpha * intensityMultiplier})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size * cameraZ, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Initialize sacred geometry
function initGeometry() {
    for (let i = 0; i < GEOMETRY_RING_COUNT; i++) {
        geometryRings.push({
            radius: 100 + i * 80,
            alpha: 0.05 + i * 0.005,
            rotationSpeed: 0.0001 * (i % 2 === 0 ? 1 : -1),
            rotation: 0,
            hexagons: i % 2 === 0
        });
    }
}

// Draw sacred geometry
function drawGeometry() {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    
    geometryRings.forEach(ring => {
        ring.rotation += ring.rotationSpeed;
        
        ctx.save();
        ctx.rotate(ring.rotation);
        ctx.strokeStyle = `rgba(50, 150, 160, ${ring.alpha * intensityMultiplier})`;
        ctx.lineWidth = 1;
        
        // Concentric circles
        ctx.beginPath();
        ctx.arc(0, 0, ring.radius * cameraZ, 0, Math.PI * 2);
        ctx.stroke();
        
        // Radial lines or hexagonal pattern
        if (ring.hexagons) {
            const sides = 6;
            for (let i = 0; i < sides; i++) {
                const angle = (i / sides) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * ring.radius * cameraZ, Math.sin(angle) * ring.radius * cameraZ);
                ctx.stroke();
            }
        } else {
            const spokes = 12;
            for (let i = 0; i < spokes; i++) {
                const angle = (i / spokes) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * ring.radius * cameraZ, Math.sin(angle) * ring.radius * cameraZ);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    });
    
    ctx.restore();
}

// Draw background
function drawBackground() {
    // Deep earth tones
    const bgGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 1.5);
    bgGradient.addColorStop(0, '#1a1510');
    bgGradient.addColorStop(0.7, '#0f0d0a');
    bgGradient.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
}

// Handle keystroke
function handleKeystroke(char) {
    const currentTime = Date.now();
    const timeSinceLastKey = lastKeystrokeTime ? currentTime - lastKeystrokeTime : 0;
    const velocity = timeSinceLastKey > 0 ? Math.min(10, 1000 / timeSinceLastKey) : 1;
    
    lastKeystrokeTime = currentTime;
    
    // Calculate position based on timing and rhythm
    let nodeX, nodeY;
    
    if (nodes.length === 0) {
        // First node at center
        nodeX = 0;
        nodeY = 0;
    } else {
        // Position based on rhythm
        const lastNode = nodes[nodes.length - 1];
        const angle = (characterCount * 0.5) + (Math.random() - 0.5) * 0.3;
        
        // Fast typing = closer clustering, slow typing = more spread
        const distance = timeSinceLastKey > 300 ? 60 + Math.random() * 40 : 25 + Math.random() * 20;
        
        nodeX = lastNode.x + Math.cos(angle) * distance;
        nodeY = lastNode.y + Math.sin(angle) * distance;
    }
    
    // Create node
    const node = new Node(char, nodeX, nodeY, velocity);
    nodes.push(node);
    characterCount++;
    totalKeystrokes++;
    
    // Create connections to previous instances of same letter
    const lowerChar = char.toLowerCase();
    if (letterIndex[lowerChar]) {
        letterIndex[lowerChar].forEach(prevNode => {
            const connection = new Connection(prevNode, node, lowerChar);
            connections.push(connection);
        });
    }
    
    // Track this letter
    if (!letterIndex[lowerChar]) {
        letterIndex[lowerChar] = [];
    }
    letterIndex[lowerChar].push(node);
    
    // Create particle burst
    for (let i = 0; i < 8; i++) {
        particles.push(new Particle(nodeX, nodeY));
    }
    
    updateStats();
}

// Update statistics display
function updateStats() {
    document.getElementById('nodeCount').textContent = nodes.length;
    document.getElementById('connectionCount').textContent = connections.length;
    document.getElementById('charCount').textContent = characterCount;
}

// Animation loop
let lastFrameTime = Date.now();
function animate() {
    if (!isPaused) {
        const currentTime = Date.now();
        const dt = (currentTime - lastFrameTime) / 1000;
        time = currentTime;
        
        // Smooth camera zoom
        cameraZ += (targetCameraZ - cameraZ) * 0.05;
        
        ctx.clearRect(0, 0, width, height);
        
        drawBackground();
        drawGeometry();
        
        // Draw connections first (behind nodes)
        connections.forEach(conn => conn.draw());
        
        // Draw nodes
        nodes.forEach(node => node.draw());
        
        // Draw and update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update(dt);
            particles[i].draw();
            if (particles[i].alpha <= 0) {
                particles.splice(i, 1);
            }
        }
        
        // Ambient particle generation
        if (Math.random() < 0.05 && nodes.length > 0) {
            const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
            particles.push(new Particle(randomNode.x, randomNode.y));
        }
        
        lastFrameTime = currentTime;
    }
    
    requestAnimationFrame(animate);
}

// Event listeners
document.getElementById('textInput').addEventListener('input', (e) => {
    const textarea = e.target;
    const newText = textarea.value;
    const oldLength = characterCount;
    const newLength = newText.length;
    
    if (newLength > oldLength) {
        // New characters added
        const addedChars = newText.slice(oldLength);
        for (let char of addedChars) {
            if (char.trim() !== '') { // Ignore pure whitespace for nodes
                handleKeystroke(char);
            } else {
                // Spaces create slight pauses/gaps but still counted
                characterCount++;
    totalKeystrokes++;
                lastKeystrokeTime = Date.now() + 200; // Add artificial delay
            }
        }
    } else if (newLength < oldLength) {
        // Text deleted - could handle differently but for now just update count
        characterCount = newLength;
        updateStats();
    }
});

document.getElementById('intensitySlider').addEventListener('input', (e) => {
    intensityMultiplier = parseFloat(e.target.value);
});

document.getElementById('viewBtn').addEventListener('click', () => {
    isBirdsEye = !isBirdsEye;
    targetCameraZ = isBirdsEye ? 0.3 : 1;
    document.getElementById('viewBtn').textContent = isBirdsEye ? 'Normal View' : "Bird's Eye (V)";
});

document.getElementById('pauseBtn').addEventListener('click', () => {
    isPaused = !isPaused;
    document.getElementById('pauseBtn').textContent = isPaused ? 'Resume (P)' : 'Pause (P)';
    if (!isPaused) lastFrameTime = Date.now();
});

document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Clear the entire network and start fresh?')) {
        nodes.length = 0;
        connections.length = 0;
        particles.length = 0;
        Object.keys(letterIndex).forEach(key => delete letterIndex[key]);
        characterCount = 0;
        lastKeystrokeTime = 0;
        cameraX = 0;
        cameraY = 0;
        document.getElementById('textInput').value = '';
        updateStats();
    }
});

document.getElementById('infoBtn').addEventListener('click', () => {
    document.getElementById('artistModal').classList.add('active');
});

document.getElementById('saveHtmlBtn').addEventListener('click', () => {
    saveAsInteractiveHTML();
});

document.getElementById('saveBtn').addEventListener('click', () => {
    // Create a temporary canvas with the current frame
    const link = document.createElement('a');
    link.download = `mycelial-network-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
});

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts when typing in textarea
    if (e.target.tagName === 'TEXTAREA') return;
    
    if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        document.getElementById('viewBtn').click();
    }
    
    if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        document.getElementById('pauseBtn').click();
    }
    
    if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        document.getElementById('artistModal').classList.add('active');
    }
    
    if (e.key === 'Escape') {
        document.getElementById('artistModal').classList.remove('active');
    }
});

// Window resize
window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
});

// Begin growing
function beginGrowing() {
    document.getElementById('introModal').classList.add('hidden');
    document.getElementById('textInputContainer').style.display = 'block';
    document.getElementById('statsPanel').style.display = 'block';
    document.getElementById('controlsBar').style.display = 'flex';
    
    // Focus on textarea
    setTimeout(() => {
        document.getElementById('textInput').focus();
    }, 300);
}

// Close modal
function closeModal() {
    document.getElementById('artistModal').classList.remove('active');
}

// Modal click outside
document.getElementById('artistModal').addEventListener('click', (e) => {
    if (e.target.id === 'artistModal') {
        closeModal();
    }
});

window.beginGrowing = beginGrowing;
window.closeModal = closeModal;

// Save as interactive HTML
function saveAsInteractiveHTML() {
    const timestamp = new Date();
    const filename = `mycelium_${timestamp.getFullYear()}-${String(timestamp.getMonth()+1).padStart(2,'0')}-${String(timestamp.getDate()).padStart(2,'0')}_${String(timestamp.getHours()).padStart(2,'0')}${String(timestamp.getMinutes()).padStart(2,'0')}.html`;
    
    // Prepare network data for serialization
    const networkData = {
        nodes: nodes.map(n => ({
            char: n.char,
            x: n.x,
            y: n.y,
            creationTime: n.creationTime,
            velocity: n.velocity,
            size: n.size,
            colorIndex: n.colorIndex,
            pulsePhase: n.pulsePhase,
            pulseSpeed: n.pulseSpeed
        })),
        connections: connections.map(c => ({
            fromIndex: nodes.indexOf(c.fromNode),
            toIndex: nodes.indexOf(c.toNode),
            letter: c.letter,
            creationTime: c.creationTime,
            brightness: c.brightness
        })),
        letterIndex: Object.fromEntries(
            Object.entries(letterIndex).map(([key, nodeArr]) => [
                key,
                nodeArr.map(n => nodes.indexOf(n))
            ])
        ),
        originalText: document.getElementById('textInput').value,
        metadata: {
            creationDate: timestamp.toISOString(),
            sessionDuration: Math.floor((Date.now() - sessionStartTime) / 1000),
            totalKeystrokes: totalKeystrokes,
            uniqueCharacters: Object.keys(letterIndex).length,
            nodeCount: nodes.length,
            connectionCount: connections.length,
            characterCount: characterCount
        }
    };
    
    // Get letter frequency stats
    const letterFreq = Object.entries(letterIndex)
        .map(([letter, instances]) => ({ letter, count: instances.length }))
        .sort((a, b) => b.count - a.count);
    
    networkData.metadata.mostFrequent = letterFreq.slice(0, 5);
    networkData.metadata.leastFrequent = letterFreq.slice(-5).reverse();
    
    // Generate complete HTML file
    const htmlContent = generateStandaloneHTML(networkData);
    
    // Download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function generateStandaloneHTML(data) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mycelial Network Archive - ${data.metadata.creationDate}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: rgba(200, 220, 240, 0.9);
            overflow: hidden;
        }
        #canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(ellipse at center, #1a1510 0%, #0a0a0a 70%);
        }
        .controls {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(15, 25, 25, 0.9);
            padding: 16px;
            border-radius: 12px;
            border: 1px solid rgba(50, 200, 220, 0.3);
            backdrop-filter: blur(10px);
            z-index: 10;
            max-width: 250px;
        }
        .controls h3 {
            font-size: 14px;
            color: rgba(50, 200, 220, 0.9);
            margin-bottom: 12px;
            font-weight: 600;
        }
        .control-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 12px;
        }
        .control-label {
            color: rgba(150, 200, 190, 0.8);
        }
        .btn {
            width: 100%;
            padding: 8px 12px;
            margin: 4px 0;
            font-size: 12px;
            background: rgba(30, 120, 140, 0.2);
            color: rgba(80, 220, 240, 0.9);
            border: 1px solid rgba(50, 200, 220, 0.3);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn:hover {
            background: rgba(30, 120, 140, 0.4);
            border-color: rgba(50, 200, 220, 0.5);
        }
        .slider {
            width: 100px;
            height: 4px;
            border-radius: 9999px;
            background: rgba(50, 100, 110, 0.3);
            outline: none;
            -webkit-appearance: none;
        }
        .slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: rgba(50, 200, 220, 0.9);
            cursor: pointer;
        }
        .metadata {
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(15, 25, 25, 0.9);
            padding: 16px;
            border-radius: 12px;
            border: 1px solid rgba(50, 200, 220, 0.3);
            backdrop-filter: blur(10px);
            z-index: 10;
            max-width: 300px;
        }
        .metadata h3 {
            font-size: 14px;
            color: rgba(50, 200, 220, 0.9);
            margin-bottom: 12px;
            font-weight: 600;
        }
        .stat-line {
            display: flex;
            justify-content: space-between;
            margin: 6px 0;
            font-size: 11px;
        }
        .stat-label { color: rgba(150, 180, 190, 0.7); }
        .stat-value { color: rgba(80, 220, 240, 0.9); font-weight: 500; }
        .text-display {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 700px;
            max-height: 200px;
            overflow-y: auto;
            background: rgba(15, 25, 25, 0.95);
            padding: 16px;
            border-radius: 12px;
            border: 1px solid rgba(50, 200, 220, 0.3);
            backdrop-filter: blur(10px);
            z-index: 10;
            font-size: 13px;
            line-height: 1.6;
            color: rgba(180, 200, 200, 0.85);
            display: none;
        }
        .text-display.visible { display: block; }
        .footer {
            position: fixed;
            bottom: 16px;
            right: 24px;
            font-size: 11px;
            color: rgba(50, 200, 220, 0.3);
            z-index: 5;
            letter-spacing: 0.02em;
        }
        .footer a {
            color: rgba(50, 200, 220, 0.4);
            text-decoration: none;
        }
        .footer a:hover { color: rgba(50, 200, 220, 0.7); }
        .timeline {
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            display: none;
            align-items: center;
            gap: 12px;
            background: rgba(15, 25, 25, 0.9);
            padding: 12px 16px;
            border-radius: 12px;
            border: 1px solid rgba(50, 200, 220, 0.3);
            backdrop-filter: blur(10px);
            z-index: 10;
        }
        .timeline.visible { display: flex; }
        .timeline-slider {
            flex: 1;
            height: 4px;
        }
        .timeline-label {
            font-size: 11px;
            color: rgba(150, 200, 190, 0.8);
            white-space: nowrap;
        }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    
    <div class="metadata" id="metadata">
        <h3>Network Archive</h3>
        <div class="stat-line"><span class="stat-label">Created:</span><span class="stat-value">${new Date(data.metadata.creationDate).toLocaleString()}</span></div>
        <div class="stat-line"><span class="stat-label">Duration:</span><span class="stat-value">${Math.floor(data.metadata.sessionDuration / 60)}m ${data.metadata.sessionDuration % 60}s</span></div>
        <div class="stat-line"><span class="stat-label">Keystrokes:</span><span class="stat-value">${data.metadata.totalKeystrokes}</span></div>
        <div class="stat-line"><span class="stat-label">Nodes:</span><span class="stat-value">${data.metadata.nodeCount}</span></div>
        <div class="stat-line"><span class="stat-label">Connections:</span><span class="stat-value">${data.metadata.connectionCount}</span></div>
        <div class="stat-line"><span class="stat-label">Unique Chars:</span><span class="stat-value">${data.metadata.uniqueCharacters}</span></div>
    </div>
    
    <div class="controls">
        <h3>View Controls</h3>
        <div class="control-row">
            <span class="control-label">Intensity</span>
            <input type="range" id="intensity" class="slider" min="0.3" max="2" step="0.1" value="1">
        </div>
        <button class="btn" id="viewBtn">Bird's Eye View (V)</button>
        <button class="btn" id="pauseBtn">Pause (P)</button>
        <button class="btn" id="textBtn">Show Text (T)</button>
        <button class="btn" id="metadataBtn">Hide Metadata (M)</button>
        <button class="btn" id="timelineBtn">Show Timeline (L)</button>
    </div>
    
    <div class="text-display" id="textDisplay">
        <strong style="color: rgba(50, 200, 220, 0.9); display: block; margin-bottom: 8px;">Original Text:</strong>
        ${data.originalText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
    </div>
    
    <div class="timeline" id="timeline">
        <span class="timeline-label">Timeline:</span>
        <input type="range" id="timelineSlider" class="slider timeline-slider" min="0" max="100" value="100">
        <span class="timeline-label" id="timelineValue">100%</span>
    </div>
    
    <div class="footer">
        digital monument by <a href="https://unearth.im" target="_blank">unearth.im</a>
    </div>

    <script>
        const networkData = ${JSON.stringify(data)};
        
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        
        let isPaused = false;
        let isBirdsEye = false;
        let intensityMultiplier = 1;
        let time = Date.now();
        let cameraZ = 1;
        let targetCameraZ = 1;
        let timelineProgress = 1;
        
        const biolumColors = [
            { h: 180, s: 70, l: 60 },
            { h: 140, s: 60, l: 55 },
            { h: 280, s: 60, l: 60 },
            { h: 200, s: 50, l: 70 }
        ];
        
        class Node {
            constructor(data) {
                Object.assign(this, data);
                this.baseCreationTime = data.creationTime;
            }
            
            get age() {
                return (time - this.creationTime) / 1000;
            }
            
            get glowIntensity() {
                return Math.max(0.3, 1 - this.age / 100);
            }
            
            draw() {
                const pulse = Math.sin(time * this.pulseSpeed + this.pulsePhase) * 0.2 + 0.8;
                const intensity = this.glowIntensity * pulse * intensityMultiplier;
                const screenX = width / 2 + this.x * cameraZ;
                const screenY = height / 2 + this.y * cameraZ;
                const color = biolumColors[this.colorIndex];
                
                const glowGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, this.size * 3 * cameraZ);
                glowGradient.addColorStop(0, \`hsla(\${color.h}, \${color.s}%, \${color.l}%, \${0.6 * intensity})\`);
                glowGradient.addColorStop(0.5, \`hsla(\${color.h}, \${color.s}%, \${color.l}%, \${0.3 * intensity})\`);
                glowGradient.addColorStop(1, \`hsla(\${color.h}, \${color.s}%, \${color.l}%, 0)\`);
                
                ctx.fillStyle = glowGradient;
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.size * 3 * cameraZ, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = \`hsla(\${color.h}, \${color.s}%, \${Math.min(color.l + 20, 90)}%, \${0.9 * intensity})\`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.size * cameraZ, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        class Connection {
            constructor(data, fromNode, toNode) {
                Object.assign(this, data);
                this.fromNode = fromNode;
                this.toNode = toNode;
                this.baseCreationTime = data.creationTime;
            }
            
            get age() {
                return (time - this.creationTime) / 1000;
            }
            
            draw() {
                const from = this.fromNode;
                const to = this.toNode;
                const fromX = width / 2 + from.x * cameraZ;
                const fromY = height / 2 + from.y * cameraZ;
                const toX = width / 2 + to.x * cameraZ;
                const toY = height / 2 + to.y * cameraZ;
                
                const avgGlow = (from.glowIntensity + to.glowIntensity) / 2;
                const intensity = avgGlow * this.brightness * intensityMultiplier;
                const shimmer = Math.sin(time * 0.003 + this.age) * 0.2 + 0.8;
                const avgColorIndex = Math.floor((from.colorIndex + to.colorIndex) / 2);
                const color = biolumColors[avgColorIndex];
                
                ctx.strokeStyle = \`hsla(\${color.h}, \${color.s}%, \${color.l}%, \${0.4 * intensity * shimmer})\`;
                ctx.lineWidth = Math.max(1, 2 * cameraZ);
                ctx.lineCap = 'round';
                
                const midX = (fromX + toX) / 2;
                const midY = (fromY + toY) / 2;
                
                ctx.beginPath();
                ctx.moveTo(fromX, fromY);
                ctx.quadraticCurveTo(midX, midY, toX, toY);
                ctx.stroke();
                
                ctx.strokeStyle = \`hsla(\${color.h}, \${color.s}%, \${Math.min(color.l + 15, 85)}%, \${0.2 * intensity * shimmer})\`;
                ctx.lineWidth = Math.max(0.5, 1 * cameraZ);
                ctx.beginPath();
                ctx.moveTo(fromX, fromY);
                ctx.quadraticCurveTo(midX, midY, toX, toY);
                ctx.stroke();
            }
        }
        
        const nodes = networkData.nodes.map(n => new Node(n));
        const connections = networkData.connections.map(c => 
            new Connection(c, nodes[c.fromIndex], nodes[c.toIndex])
        );
        
        function drawBackground() {
            const bgGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/1.5);
            bgGradient.addColorStop(0, '#1a1510');
            bgGradient.addColorStop(0.7, '#0f0d0a');
            bgGradient.addColorStop(1, '#0a0a0a');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, width, height);
        }
        
        function drawGeometry() {
            ctx.save();
            ctx.translate(width / 2, height / 2);
            ctx.strokeStyle = \`rgba(50, 150, 160, \${0.05 * intensityMultiplier})\`;
            ctx.lineWidth = 1;
            
            for (let i = 0; i < 8; i++) {
                const radius = (100 + i * 80) * cameraZ;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.stroke();
                
                const sides = 6;
                for (let j = 0; j < sides; j++) {
                    const angle = (j / sides) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
                    ctx.stroke();
                }
            }
            ctx.restore();
        }
        
        function updateTimeline() {
            const maxTime = Math.max(...nodes.map(n => n.baseCreationTime));
            const cutoffTime = maxTime * timelineProgress;
            
            nodes.forEach(n => {
                n.creationTime = n.baseCreationTime <= cutoffTime ? n.baseCreationTime : Date.now() + 999999;
            });
            connections.forEach(c => {
                c.creationTime = c.baseCreationTime <= cutoffTime ? c.baseCreationTime : Date.now() + 999999;
            });
        }
        
        function animate() {
            if (!isPaused) {
                time = Date.now();
                cameraZ += (targetCameraZ - cameraZ) * 0.05;
                
                ctx.clearRect(0, 0, width, height);
                drawBackground();
                drawGeometry();
                
                const visibleConnections = connections.filter(c => c.creationTime <= time);
                const visibleNodes = nodes.filter(n => n.creationTime <= time);
                
                visibleConnections.forEach(c => c.draw());
                visibleNodes.forEach(n => n.draw());
            }
            requestAnimationFrame(animate);
        }
        
        document.getElementById('intensity').addEventListener('input', e => {
            intensityMultiplier = parseFloat(e.target.value);
        });
        
        document.getElementById('viewBtn').addEventListener('click', () => {
            isBirdsEye = !isBirdsEye;
            targetCameraZ = isBirdsEye ? 0.3 : 1;
            document.getElementById('viewBtn').textContent = isBirdsEye ? 'Normal View' : "Bird's Eye View (V)";
        });
        
        document.getElementById('pauseBtn').addEventListener('click', () => {
            isPaused = !isPaused;
            document.getElementById('pauseBtn').textContent = isPaused ? 'Resume (P)' : 'Pause (P)';
        });
        
        document.getElementById('textBtn').addEventListener('click', () => {
            const display = document.getElementById('textDisplay');
            display.classList.toggle('visible');
            document.getElementById('textBtn').textContent = display.classList.contains('visible') ? 'Hide Text (T)' : 'Show Text (T)';
        });
        
        document.getElementById('metadataBtn').addEventListener('click', () => {
            const metadata = document.getElementById('metadata');
            metadata.style.display = metadata.style.display === 'none' ? 'block' : 'none';
            document.getElementById('metadataBtn').textContent = metadata.style.display === 'none' ? 'Show Metadata (M)' : 'Hide Metadata (M)';
        });
        
        document.getElementById('timelineBtn').addEventListener('click', () => {
            const timeline = document.getElementById('timeline');
            timeline.classList.toggle('visible');
            document.getElementById('timelineBtn').textContent = timeline.classList.contains('visible') ? 'Hide Timeline (L)' : 'Show Timeline (L)';
        });
        
        document.getElementById('timelineSlider').addEventListener('input', e => {
            timelineProgress = parseFloat(e.target.value) / 100;
            document.getElementById('timelineValue').textContent = Math.round(timelineProgress * 100) + '%';
            updateTimeline();
        });
        
        window.addEventListener('keydown', e => {
            if (e.key === 'v' || e.key === 'V') {
                e.preventDefault();
                document.getElementById('viewBtn').click();
            }
            if (e.key === 'p' || e.key === 'P') {
                e.preventDefault();
                document.getElementById('pauseBtn').click();
            }
            if (e.key === 't' || e.key === 'T') {
                e.preventDefault();
                document.getElementById('textBtn').click();
            }
            if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                document.getElementById('metadataBtn').click();
            }
            if (e.key === 'l' || e.key === 'L') {
                e.preventDefault();
                document.getElementById('timelineBtn').click();
            }
        });
        
        window.addEventListener('resize', () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        });
        
        animate();
    </script>
</body>
</html>`;
}

// Initialize and start
initGeometry();
animate();
updateStats();