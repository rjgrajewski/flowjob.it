import AbstractView from "./AbstractView.js";
import { Auth } from "../services/AuthService.js";
import { navigateTo } from "../router.js";
import { updateNavigation } from "../ui.js";

export default class extends AbstractView {
    constructor() {
        super();
        this.setTitle("Aligno - Register");
    }

    async getHtml() {
        return `
            <div class="container" style="max-width: 400px;">
                <h1 class="text-center mb-4">Register</h1>
                <form id="register-form" class="card">
                    <div class="form-group">
                        <label class="form-label">Full Name</label>
                        <input type="text" name="name" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" name="email" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" name="password" class="form-input" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Create Account</button>
                </form>
            </div>
        `;
    }

    executeScript() {
        const form = document.getElementById('register-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const userData = Object.fromEntries(formData.entries());

            await Auth.register(userData);
            updateNavigation(); // Update nav bar visibility
            navigateTo('/cv'); // Redirect using custom router
        });
    }
}
