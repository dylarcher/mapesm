import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-home',
  template: `
    <div class="home-page">
      <h2>Welcome Home</h2>
      <p>This is the home page of our Angular demo application.</p>
      <div *ngIf="users.length > 0">
        <h3>Users:</h3>
        <ul>
          <li *ngFor="let user of users">{{ user.name }}</li>
        </ul>
      </div>
    </div>
  `,
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  users: any[] = [];

  constructor(private userService: UserService) { }

  ngOnInit() {
    this.users = this.userService.getUsers();
  }
}
