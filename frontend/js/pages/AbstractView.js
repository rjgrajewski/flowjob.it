export default class AbstractView {
    constructor() {
    }

    setTitle(title) {
        document.title = title;
    }

    async getHtml() {
        return "";
    }

    async executeScript() {
        // Optional method for executing JS after HTML is injected
    }
}
