import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormGroupName, Validators } from '@angular/forms';
import {Team} from '../Models/team';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'frontend';
  regions: any;
  teams: Team[] = [];
  currentRegion : string;
  insertForm: FormGroup;
  displayData = false;

  constructor(private httpclient: HttpClient) {}

  ngOnInit(){
    this.insertForm = new FormGroup({
      "nume": new FormControl(null, Validators.required),
      "imagine": new FormControl(null, Validators.required),
      "nrMembrii": new FormControl(null, Validators.required),
      "finalist": new FormControl(false, Validators.required)
    });
  }

  displayRegions(){
    this.displayData = true;
    this.httpclient.get("http://localhost:4000/").subscribe(response => {
      this.regions = response;
    });
  }

  filterByRegion(region: any){
    this.currentRegion = region;
    this.httpclient.get<Team[]>("http://localhost:4000/region/" + region).subscribe(response => {
      this.teams = response;
    });
  }

  submit(){
    if(this.currentRegion == null){
      alert("Alegeti o regiune!");
    }
    else{
    let dataToInsert: Team = this.insertForm.value;
    dataToInsert.from = this.currentRegion;
    this.httpclient.post<any>("http://localhost:4000/region", dataToInsert).subscribe(res => {
      this.filterByRegion(this.currentRegion);
      if(res.eroare){
        alert(res.eroare);
      }
    });
    }
  }

  delete(nume: HTMLParagraphElement){
    this.httpclient.post<any>("http://localhost:4000/delete", {nume: nume.textContent}).subscribe(res => {
      this.filterByRegion(this.currentRegion);
      alert(res.mesaj);
    });
  }
}
