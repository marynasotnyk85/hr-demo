import { NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface TableColumn<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  cell?: (row: T) => string;
}

export interface TableState<T> {
  page: number; 
  size: number;
  sort?: keyof T;
  dir?: 'asc' | 'desc';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss'
})
export class DataTableComponent<T extends {id:number}>{
  @Input({required: true}) columns! : TableColumn<T>[];
  @Input({ required: true }) rows: T[] = [];
  @Input({ required: true }) total = 0;
  @Input({ required: true }) state!: TableState<T>;
  @Input() actions = false;

  @Output() stateChange = new EventEmitter<TableState<T>>();

  get maxPage() {
    return Math.max(1, Math.ceil(this.total / this.state.size));
  }

  trackById = (_:number, row: T) => row.id;

  toggleSort(key: keyof T) {
    if (this.state.sort !== key) {
      this.stateChange.emit({ ...this.state, sort: key, dir: 'asc', page: 1 });
      return;
    }
    const nextDir = this.state.dir === 'asc' ? 'desc' : 'asc';
    this.stateChange.emit({ ...this.state, dir: nextDir, page: 1 });
  }

  ariaSort(key: keyof T) {
    if (this.state.sort !== key) return 'none';
    return this.state.dir === 'asc' ? 'ascending' : 'descending';
  }

  prev() {
    this.stateChange.emit({ ...this.state, page: this.state.page - 1 });
  }

  next() {
    this.stateChange.emit({ ...this.state, page: this.state.page + 1 });
  }

  changeSize(sizeRaw: string) {
    const size = Number(sizeRaw);
    this.stateChange.emit({ ...this.state, size, page: 1 });
  }

}
