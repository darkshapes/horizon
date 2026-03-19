/ src/index.js
import { MultiTouchSlider } from './slider-controller.js';

// Handle Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const root = document.documentElement;

themeToggle.addEventListener('click', () => {
    const currentTheme = root.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', newTheme);
    themeToggle.textContent = newTheme === 'light' ? '☀️' : '🌙';
});

// Initialize the App
document.addEventListener('DOMContentLoaded', () => {
    new MultiTouchSlider();
});