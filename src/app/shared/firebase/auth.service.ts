import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private fireAuth: AngularFireAuth,
    private router: Router,
  ) { }

  async login(email: string, password: string): Promise<any>{
    return this.fireAuth.signInWithEmailAndPassword(email, password);
  }

  logout(){
    this.fireAuth.signOut().then(() => {
      localStorage.removeItem('token');
      this.router.navigate(['/']);
    }, err => {
      alert(err.message);
      console.error(err);
    })
  }
}
