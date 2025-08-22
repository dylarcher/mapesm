import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  template: `
    <div class="about-page">
      <h2>About Us</h2>
      <p>This is a demo Angular application showcasing typical Angular project structure.</p>
      <p>Features include:</p>
      <ul>
        <li>Component-based architecture</li>
        <li>Service injection</li>
        <li>Routing</li>
        <li>Modular design</li>
      </ul>
    </div>
  `,
  styleUrls: ['./about.component.css']
})
export class AboutComponent { }
