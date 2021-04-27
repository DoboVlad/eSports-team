import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
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

  constructor(private httpclient: HttpClient) {}

  ngOnInit(){
    this.insertForm = new FormGroup({
      "nume": new FormControl(null, Validators.required),
      "imagine": new FormControl(null, Validators.required),
      "nrMembrii": new FormControl(null, Validators.required),
      "finalist": new FormControl(false, Validators.required)
    });

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
    let dataToInsert: Team = this.insertForm.value;
    dataToInsert.from = this.currentRegion;
    this.httpclient.post("http://localhost:4000/region", dataToInsert).subscribe(res => {
      this.filterByRegion(this.currentRegion);
    });
  }
}
