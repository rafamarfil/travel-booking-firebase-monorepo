/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import * as auth from 'firebase/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';

import { LoginData } from '../models/login-data.interface';
import { User } from '../models/user.interface';

@Injectable()
export class AuthDataAccessServicesAuthService {
  userData: any;

  constructor(
    private auth: AngularFireAuth,
    public afs: AngularFirestore,
    public ngZone: NgZone,
    public router: Router,
    public snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {
    this.auth.authState.subscribe((user) => {
      if (user) {
        this.userData = user;
        localStorage.setItem('user', JSON.stringify(this.userData));
        JSON.parse(localStorage.getItem('user')!);
      } else {
        localStorage.setItem('user', 'null');
        JSON.parse(localStorage.getItem('user')!);
      }
    });
  }

  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user')!);
    return user !== null && user.emailVerified !== false ? true : false;
  }

  login({ email, password }: LoginData) {
    return this.auth
      .signInWithEmailAndPassword(email, password)
      .then((response: any) => {
        console.log(response);
        this.ngZone.run(() => {
          this.router.navigate(['booking']);
        });
        this.setUserData(response.user);
        // this.saveToken(token);
      })
      .catch((error) => {
        console.log(error);
        const errorCode = error.code;
        const errorMessage = error.message;
        if (errorCode === 'auth/wrong-password') {
          this.snackBar.open('Wrong password', '', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
          });
        } else if (errorCode === 'auth/user-not-found') {
          this.snackBar.open('Wrong user', '', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
          });
        } else {
          console.log(errorMessage);
        }
      });
  }

  googleAuth() {
    return this.authLogin(new auth.GoogleAuthProvider()).then((res: any) => {
      if (res) {
        this.router.navigate(['booking']);
      }
    });
  }

  register({ email, password }: LoginData) {
    return this.auth
      .createUserWithEmailAndPassword(email, password)
      .then((response) => {
        this.sendVerificationMail();
        this.setUserData(response.user);
        // this.router.navigate(['..'], {
        //   relativeTo: this.route,
        // });
        this.snackBar.open(`User Registered! Now, you can login`, '', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
        });
      })
      .catch((error) => {
        console.log(error.message);
      });
  }

  logOut() {
    return this.auth.signOut().then(() => {
      localStorage.removeItem('user');
      this.router.navigate(['auth']);
    });
  }

  forgotPassword(passwordResetEmail: string) {
    return this.auth
      .sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        this.snackBar.open(`Password reset email sent, check your inbox.`, '', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  sendVerificationMail() {
    return this.auth.currentUser
      .then((u: any) => u.sendEmailVerification())
      .then(() => {
        this.router.navigate(['auth/verify-email-address']);
      });
  }

  private setUserData(user: any) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users/${user.uid}`
    );
    const userData: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
    };
    return userRef.set(userData, {
      merge: true,
    });
  }

  private authLogin(provider: any) {
    return this.auth
      .signInWithPopup(provider)
      .then((response) => {
        this.ngZone.run(() => {
          this.router.navigate(['booking']);
        });
        this.setUserData(response.user);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  private saveToken(token: string) {
    localStorage.setItem('auth_token', token);
  }
}
