/* Enhanced Air & Groundwater Intelligence Dashboard */

/* ---------- Utilities ---------- */
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function hexToRgb(h) {
    if (h[0] === '#') h = h.slice(1);
    let bigint = parseInt(h, 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}
function rgbToCss(c) { return `rgb(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)})`; }
function lerp(a, b, t) { return a + (b - a) * t; }
function lerpColor(hexA, hexB, t) {
    const A = hexToRgb(hexA), B = hexToRgb(hexB);
    return { r: lerp(A.r, B.r, t), g: lerp(A.g, B.g, t), b: lerp(A.b, B.b, t) };
}

function aqiNormalized(aqi) {
    const max = 300;
    return clamp(aqi / max, 0, 1);
}

function reactorGradientCssFromAQI(aqi) {
    const t = aqiNormalized(aqi);
    let c1, c2;
    if (t <= 0.5) {
        const tt = t / 0.5;
        c1 = rgbToCss(lerpColor('#c8ffe0', '#FFD36A', tt * 0.4));
        c2 = rgbToCss(lerpColor('#7CFF9A', '#ffd36a', tt * 0.8));
        return `radial-gradient(circle at 35% 35%, #ffffff 0%, #b0ffcc 30%, #7CFF9A 60%, #00e070 100%)`;
    } else {
        const tt = (t - 0.5) / 0.5;
        c1 = rgbToCss(lerpColor('#FFD36A', '#FF6B6B', tt * 0.7));
        c2 = rgbToCss(lerpColor('#ff9d4a', '#b02a2a', tt));
        return `radial-gradient(circle at 30% 30%, ${c1} 0%, #ff8c6a 20%, ${c2} 55%, #5a0000 100%)`;
    }
}

/* ---------- Particle Orbit Effect ---------- */
class ParticleOrbit {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.dpr = window.devicePixelRatio || 1;
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.initParticles(40);
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.width = Math.max(1, Math.floor(rect.width));
        this.height = Math.max(1, Math.floor(rect.height));
        this.canvas.width = Math.floor(this.width * this.dpr);
        this.canvas.height = Math.floor(this.height * this.dpr);
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.center = { x: this.width / 2, y: this.height / 2 };
    }

    initParticles(n) {
        this.particles = [];
        for (let i = 0; i < n; i++) {
            const r = (Math.random() * (this.width * 0.45 - 20)) + 20;
            this.particles.push({
                angle: Math.random() * Math.PI * 2,
                radius: r,
                speed: (Math.random() * 0.6 + 0.2) * (Math.random() < 0.5 ? 1 : -1),
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.7 + 0.5,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
    }

    setGlowColor(rgbCss) {
        this.glowColor = rgbCss;
    }

    animate() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.globalCompositeOperation = 'lighter';

        for (let p of this.particles) {
            p.angle += p.speed * 0.01;
            p.pulsePhase += 0.02;
            const pulseFactor = Math.sin(p.pulsePhase) * 0.3 + 1;

            const x = this.center.x + Math.cos(p.angle) * p.radius;
            const y = this.center.y + Math.sin(p.angle) * p.radius * (0.7 + Math.sin(p.angle * 2.8) * 0.15);

            const currentSize = p.size * pulseFactor;
            const currentOpacity = p.opacity * pulseFactor;

            // Main particle glow
            ctx.beginPath();
            ctx.fillStyle = this.glowColor || `rgba(124,255,154,${currentOpacity})`;
            ctx.shadowColor = this.glowColor || `rgba(124,255,154,1)`;
            ctx.shadowBlur = Math.max(15, currentSize * 15);
            ctx.arc(x, y, currentSize, 0, Math.PI * 2);
            ctx.fill();

            // Core bright spot
            ctx.shadowBlur = Math.max(8, currentSize * 8);
            ctx.fillStyle = `rgba(255,255,255,${currentOpacity * 0.8})`;
            ctx.arc(x, y, currentSize * 0.4, 0, Math.PI * 2);
            ctx.fill();

            // Trail effect
            ctx.shadowBlur = 0;
            ctx.fillStyle = `rgba(255,255,255,${currentOpacity * 0.08})`;
            ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
        }

        requestAnimationFrame(this.animate);
    }
}

/* ---------- Charts ---------- */
let aqiChart, waterBar;

function initCharts() {
    // AQI Multi-line Chart with enhanced styling
    const ctxA = document.getElementById('aqiChart').getContext('2d');

    aqiChart = new Chart(ctxA, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Good Limit',
                    data: [],
                    borderColor: '#7CFF9A',
                    backgroundColor: 'rgba(124,255,154,0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    borderWidth: 2.5,
                    pointBackgroundColor: '#7CFF9A',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 1
                },
                {
                    label: 'Moderate',
                    data: [],
                    borderColor: '#FFD36A',
                    backgroundColor: 'rgba(255,211,106,0.08)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    borderWidth: 2.5,
                    pointBackgroundColor: '#FFD36A',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 1
                },
                {
                    label: 'Normal',
                    data: [],
                    borderColor: '#7CFF9A',
                    backgroundColor: 'rgba(124,255,154,0.05)',
                    fill: false,
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                    borderWidth: 2,
                    borderDash: [5, 5]
                },
                {
                    label: '50%',
                    data: [],
                    borderColor: '#8FD3FF',
                    backgroundColor: 'rgba(143,211,255,0.08)',
                    fill: false,
                    tension: 0.4,
                    pointRadius: 2.5,
                    pointHoverRadius: 5,
                    borderWidth: 2.5,
                    pointBackgroundColor: '#8FD3FF',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 1
                },
                {
                    label: 'Unhealthy',
                    data: [],
                    borderColor: '#B68FFF',
                    backgroundColor: 'rgba(182,143,255,0.08)',
                    fill: false,
                    tension: 0.4,
                    pointRadius: 2.5,
                    pointHoverRadius: 5,
                    borderWidth: 2,
                    pointBackgroundColor: '#B68FFF',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: '#9aa7d9',
                        font: { size: 11, family: 'Exo 2' },
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 15, 40, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#9aa7d9',
                    borderColor: 'rgba(124, 255, 154, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(1);
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#5a6b9f', font: { size: 10 } },
                    grid: { display: false }
                },
                y: {
                    ticks: { color: '#5a6b9f', font: { size: 10 } },
                    grid: { color: 'rgba(124, 255, 154, 0.05)' }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            }
        }
    });



    // Water Bar Chart
    const ctxW = document.getElementById('waterChart').getContext('2d');
    waterBar = new Chart(ctxW, {
        type: 'bar',
        data: {
            labels: ['pH', 'Sound', 'Ground Water Level (ft)'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#8FD3FF', '#7CFF9A', '#8FD3FF'],
                borderRadius: 8,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(10, 15, 40, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#9aa7d9',
                    borderColor: 'rgba(124, 255, 154, 0.3)',
                    borderWidth: 1,
                    padding: 10
                }
            },
            scales: {
                x: {
                    ticks: { color: '#5a6b9f', font: { size: 10 } },
                    grid: { display: false }
                },
                y: {
                    display: true,
                    ticks: { color: '#5a6b9f', font: { size: 10 } },
                    grid: { color: 'rgba(124, 255, 154, 0.05)' }
                }
            }
        }
    });
}

/* ---------- Dashboard Update ---------- */
async function updateDashboard() {
    try {
        const [resAir, resWater] = await Promise.all([fetch('/data'), fetch('/water_data')]);
        const airData = await resAir.json();
        const waterData = await resWater.json();

        // Update AIR data
        if (airData && airData.timestamps && airData.timestamps.length > 0) {
            const last = airData.timestamps.length - 1;
            const pm25 = +(airData.pm25[last] || 0);
            const pm10 = +(airData.pm10[last] || 0);
            const co = +(airData.co[last] || 0);
            const no2 = +(airData.no2[last] || 0);
            const so2 = +(airData.so2[last] || 0);
            const o3 = +(airData.o3[last] || 0);

            // Update AQI display
            document.getElementById('aqi-value').innerText = Math.round(pm25);
            document.getElementById('val-pm25').innerText = Math.round(pm25);
            document.getElementById('val-pm10').innerText = Math.round(pm10);
            document.getElementById('val-co').innerText = Math.round(co);
            document.getElementById('val-no2').innerText = Math.round(no2);
            document.getElementById('val-o3').innerText = Math.round(o3);
            document.getElementById('val-so2').innerText = Math.round(so2);

            // Update AQI status
            const statusEl = document.getElementById('aqi-status');
            if (pm25 <= 50) {
                statusEl.innerText = 'Good';
                statusEl.style.background = 'rgba(31,143,76,0.15)';
                statusEl.style.color = '#7CFF9A';
                statusEl.style.borderColor = 'rgba(124,255,154,0.2)';
            } else if (pm25 <= 100) {
                statusEl.innerText = 'Moderate';
                statusEl.style.background = 'rgba(255,211,106,0.15)';
                statusEl.style.color = '#FFD36A';
                statusEl.style.borderColor = 'rgba(255,211,106,0.2)';
            } else {
                statusEl.innerText = 'Unhealthy';
                statusEl.style.background = 'rgba(255,107,107,0.15)';
                statusEl.style.color = '#FF6B6B';
                statusEl.style.borderColor = 'rgba(255,107,107,0.2)';
            }

            // Update reactor sphere gradient
            const sphere = document.getElementById('sphere');
            sphere.style.background = reactorGradientCssFromAQI(pm25);

            // Update particle color
            const midColor = lerpColor('#7CFF9A', '#FF6B6B', aqiNormalized(pm25));
            particleSystem.setGlowColor(`rgba(${Math.round(midColor.r)},${Math.round(midColor.g)},${Math.round(midColor.b)},0.9)`);

            // Update main line chart with multiple datasets
            const limit = 20;
            const labels = airData.timestamps.slice(-limit).map(t => {
                const parts = t.split(' ');
                return parts[1] ? parts[1].slice(0, 5) : t;
            });

            aqiChart.data.labels = labels;
            // Create varied data for demonstration
            aqiChart.data.datasets[0].data = airData.pm25.slice(-limit).map(v => v * 1.1);
            aqiChart.data.datasets[1].data = airData.pm10.slice(-limit).map(v => v * 0.9);
            aqiChart.data.datasets[2].data = airData.pm25.slice(-limit).map(v => v * 1.05);
            aqiChart.data.datasets[3].data = airData.co.slice(-limit).map(v => v * 0.5);
            aqiChart.data.datasets[4].data = airData.no2.slice(-limit).map(v => v * 0.8);
            aqiChart.update('none');

            // Update last time
            const now = new Date();
            document.getElementById('lastUpdateTime').innerText =
                now.getHours().toString().padStart(2, '0') + ':' +
                now.getMinutes().toString().padStart(2, '0');

            // System online
            document.getElementById('systemStatus').className = 'system-status online';
            document.getElementById('systemStatus').innerText = 'SYSTEM ONLINE';
            document.getElementById('reactor').classList.add('online');
        } else {
            document.getElementById('systemStatus').className = 'system-status offline';
            document.getElementById('systemStatus').innerText = 'SYSTEM OFFLINE';
        }

        // Update WATER data
        if (waterData && !waterData.error) {
            const level = waterData.level !== undefined ? waterData.level : 0;
            const ph = waterData.ph !== undefined ? waterData.ph : 0;
            const turb = waterData.turbidity !== undefined ? waterData.turbidity : 0;

            document.getElementById('val-level').innerText = level.toFixed(1);
            document.getElementById('val-ph').innerText = ph.toFixed(1);
            document.getElementById('val-turb').innerText = turb.toFixed(1);
            document.getElementById('val-level-large').innerHTML =
                level.toFixed(1) + '<span class="unit">ft</span>';

            // Update water bar chart
            waterBar.data.datasets[0].data = [ph, turb / 10, level];
            waterBar.update('none');
        }

    } catch (err) {
        console.warn('Dashboard update error:', err);
        document.getElementById('systemStatus').className = 'system-status offline';
        document.getElementById('systemStatus').innerText = 'SYSTEM OFFLINE';
    }
}

/* ---------- Initialization ---------- */
let particleSystem;

window.onload = () => {
    initCharts();

    const pc = document.getElementById('particleCanvas');
    particleSystem = new ParticleOrbit(pc);

    const reactor = document.getElementById('reactor');
    reactor.classList.add('online');

    updateDashboard();
    setInterval(updateDashboard, 2000);
};

/* Download button */
document.getElementById('downloadBtn').onclick = () => {
    window.location.href = '/export_csv';
};
