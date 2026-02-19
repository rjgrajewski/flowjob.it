import AbstractView from "./AbstractView.js";
import { DataService } from "../services/DataService.js";

export default class extends AbstractView {
    constructor() {
        super();
        this.setTitle("Aligno - Jobs");
    }

    async getHtml() {
        const jobs = await DataService.getJobs();
        const cvData = DataService.getUserCV() || { skills: [], antiSkills: [] };

        // Filter jobs
        const filteredJobs = jobs.filter(job => {
            // Check anti-skills (exclusion criteria) - HIGHEST PRIORITY
            if (cvData.antiSkills && cvData.antiSkills.length > 0) {
                const hasAntiSkill = job.requiredSkills.some(skill => cvData.antiSkills.includes(skill));
                if (hasAntiSkill) return false;
            }

            // Check positive skills (matching criteria)
            // For now, we show all jobs that passed the anti-skill check, 
            // but we can rank them or filter strictly if needed.
            // Let's implement a simple match score.
            return true;
        });

        // Calculate match scores
        const jobsWithScore = filteredJobs.map(job => {
            const matchCount = job.requiredSkills.filter(skill => cvData.skills.includes(skill)).length;
            const totalSkills = job.requiredSkills.length;
            const score = totalSkills > 0 ? Math.round((matchCount / totalSkills) * 100) : 0;
            return { ...job, score };
        }).sort((a, b) => b.score - a.score); // Sort by highest match

        const renderJob = (job) => `
            <div class="card mb-4 job-card">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h3 class="mb-1">${job.title}</h3>
                        <p class="text-light mb-2">${job.company}</p>
                    </div>
                     <span class="match-score ${job.score >= 70 ? 'high' : job.score >= 40 ? 'medium' : 'low'}">
                        ${job.score}% Match
                    </span>
                </div>
                
                <p class="mb-4">${job.description}</p>
                
                <div class="mb-4">
                    <strong>Skills: </strong>
                    ${job.requiredSkills.map(skill => {
            const isMatch = cvData.skills.includes(skill);
            return `<span class="skill-badge ${isMatch ? 'match' : ''}">${skill}</span>`;
        }).join('')}
                </div>
                
                <button class="btn btn-secondary" style="width: 100%;">View Details</button>
            </div>
        `;

        return `
            <div class="container" style="max-width: 800px;">
                <h1 class="mb-4">Job Offers</h1>
                
                <div class="mb-4 text-light">
                    Showing ${jobsWithScore.length} jobs matching your profile. 
                    <span style="color: var(--danger-color);">
                        ${jobs.length - filteredJobs.length} hidden by your "Anti-Skills".
                    </span>
                </div>

                <div id="jobs-list">
                    ${jobsWithScore.length > 0 ? jobsWithScore.map(renderJob).join('') : '<p class="text-center">No jobs found matching your criteria.</p>'}
                </div>
            </div>
            
            <style>
                .text-light { color: var(--text-light); }
                
                .skill-badge {
                    display: inline-block;
                    padding: 0.2rem 0.5rem;
                    background-color: #f1f5f9;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    margin-right: 0.5rem;
                    color: var(--text-light);
                }
                
                .skill-badge.match {
                    background-color: #dbeafe;
                    color: var(--primary-color);
                    border: 1px solid #bfdbfe;
                }
                
                .match-score {
                    font-weight: bold;
                    padding: 0.25rem 0.75rem;
                    border-radius: 999px;
                    font-size: 0.875rem;
                }
                
                .match-score.high { background-color: #dcfce7; color: #166534; }
                .match-score.medium { background-color: #fef9c3; color: #854d0e; }
                .match-score.low { background-color: #f1f5f9; color: #64748b; }
            </style>
        `;
    }
}
