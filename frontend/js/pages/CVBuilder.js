import AbstractView from "./AbstractView.js";
import { DataService } from "../services/DataService.js";
import { updateNavigation } from "../ui.js";

export default class extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("Build Your CV");
    }

    async getHtml() {
        return `
            <div class="container" style="max-width: 1000px;">
                <h1 class="text-center mb-2">Build Your Profile</h1>
                <p class="text-center text-light mb-4">Select skills by clicking on the bubbles. <br>
                <span style="color: var(--primary-color); font-weight: bold;">Click</span> to Add. 
                <span style="color: var(--danger-color); font-weight: bold;">Right-Click</span> (or Shift+Click) to Block ("Anti-Skill").</p>
                
                <div class="search-container">
                    <input type="text" id="skill-search" class="search-input" placeholder="Search skills...">
                </div>

                <div class="legend">
                    <div class="legend-item">
                        <span class="legend-dot" style="background: var(--primary-color)"></span> Selected
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot" style="background: var(--danger-color)"></span> Anti-Skill (Blocked)
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot" style="background: #ccc"></span> Neutral
                    </div>
                </div>
                
                <div id="bubble-cloud" class="bubble-container">
                    <!-- Bubbles will be rendered here -->
                    <p>Loading skills...</p>
                </div>

                <div class="text-center mt-4">
                    <button type="button" id="save-profile-btn" class="btn btn-primary" style="padding: 1rem 3rem; font-size: 1.2rem;">
                        Save Profile
                    </button>
                </div>
            </div>
        `;
    }

    async executeScript() {
        // Ensure auth
        if (!DataService.getUserCV) {
            console.error("DataService not ready");
            return;
        }

        const skillsContainer = document.getElementById('bubble-cloud');
        const searchInput = document.getElementById('skill-search');
        const saveBtn = document.getElementById('save-profile-btn');

        // Fetch data
        let allSkills = [];
        try {
            allSkills = await DataService.getSkills();
        } catch (e) {
            console.error("Failed to load skills", e);
            skillsContainer.innerHTML = '<p class="text-danger">Failed to load skills.</p>';
            return;
        }

        const userCV = DataService.getUserCV() || { skills: [], antiSkills: [] };

        // Ensure sets
        let selectedSkills = new Set(userCV.skills || []);
        let antiSkills = new Set(userCV.antiSkills || []);
        let searchTerm = '';

        // Determine size range
        // If frequencies are all 0, default to 1
        const maxFreq = Math.max(...allSkills.map(s => s.frequency || 0), 1);
        const minSize = 60; // px
        const maxSize = 120; // px

        const renderBubbles = () => {
            skillsContainer.innerHTML = '';

            const filteredSkills = allSkills.filter(s =>
                s.name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (filteredSkills.length === 0) {
                skillsContainer.innerHTML = '<p>No skills found.</p>';
                return;
            }

            filteredSkills.forEach((skill, index) => {
                const bubble = document.createElement('div');
                bubble.className = 'skill-bubble';
                bubble.textContent = skill.name;

                // Color based on index/hash
                const colorIndex = (skill.name.length + index) % 10;
                bubble.classList.add(`bubble-color-${colorIndex}`);

                // Size based on frequency
                const freq = skill.frequency || 0;
                // Linear interpolation
                const size = minSize + ((maxSize - minSize) * (freq / maxFreq));

                bubble.style.width = `${size}px`;
                bubble.style.height = `${size}px`;
                bubble.style.fontSize = `${Math.max(0.8, size / 90)}rem`; // Scale font slightly

                // Selection State
                if (selectedSkills.has(skill.name)) {
                    bubble.classList.add('selected');
                } else if (antiSkills.has(skill.name)) {
                    bubble.classList.add('anti-selected');
                }

                // Interactions
                // Click -> Toggle Selection
                bubble.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (e.shiftKey) { // Shift+Click -> Toggle Anti-Skill
                        toggleAntiSkill(skill.name);
                    } else {
                        toggleSkill(skill.name);
                    }
                });

                // Context Menu (Right Click) -> Toggle Anti-Skill
                bubble.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    toggleAntiSkill(skill.name);
                });

                skillsContainer.appendChild(bubble);
            });
        };

        const toggleSkill = (name) => {
            // If it was anti, remove anti
            if (antiSkills.has(name)) antiSkills.delete(name);

            if (selectedSkills.has(name)) {
                selectedSkills.delete(name);
            } else {
                selectedSkills.add(name);
            }
            renderBubbles();
        };

        const toggleAntiSkill = (name) => {
            // If it was selected, remove selected
            if (selectedSkills.has(name)) selectedSkills.delete(name);

            if (antiSkills.has(name)) {
                antiSkills.delete(name);
            } else {
                antiSkills.add(name);
            }
            renderBubbles();
        };

        // Event Listeners
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            renderBubbles();
        });

        saveBtn.addEventListener('click', async () => {
            await DataService.saveUserCV({
                skills: Array.from(selectedSkills),
                antiSkills: Array.from(antiSkills)
            });
            alert('Profile saved successfully!');
            // navigateTo('/jobs');
        });

        // Initial Render
        renderBubbles();
    }
}
