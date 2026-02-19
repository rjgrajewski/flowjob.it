import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
    constructor() {
        super();
        this.setTitle("Aligno - Home");
    }

    async getHtml() {
        return `
            <div class="text-center">
                <h1>Welcome to Aligno</h1>
                <p>Align your skills with the perfect job.</p>
                <div class="mt-4">
                    <a href="#/register" class="btn btn-primary" data-link>Get Started</a>
                </div>
            </div>
        `;
    }
}
