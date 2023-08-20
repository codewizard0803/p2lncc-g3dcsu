import { Component, OnInit, Input } from '@angular/core';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import * as FileSaver from 'file-saver';
import { MessageService, SelectItem } from 'primeng/api';

import { Table } from 'primeng/table';
import { Customer, Representative } from '../../domain/customer';
import { CustomerService } from '../../service/customerservice';

interface Column {
  field: string;
  header: string;
  filterType: string;
}

@Component({
  selector: 'table-filter-menu-demo',
  templateUrl: 'table-filter-menu-demo.html',
  styleUrls: ['table-filter-menu-demo.scss'],
  animations: [
    trigger('fadeInOut', [
      state(
        'void',
        style({
          opacity: 0,
        })
      ),
      transition('void <=> *', animate(500)),
    ]),
  ],
  providers: [MessageService],
})
export class TableFilterMenuDemo implements OnInit {
  selectedTable: string;

  tables = [
    { label: 'Customers', value: 'customers' },
    { label: 'Holdings', value: 'holdings' },
  ];

  etfs = [
    {
      ticker: 'TQQQ',
      name: 'ProShares UltraPro QQQ',
      mer: 1.3,
      allocation: 30,
    },
    {
      ticker: 'UPRO',
      name: 'ProShares UltraPro S&P500',
      mer: 1.2,
      allocation: 30,
    },
    {
      ticker: 'TMF',
      name: 'Direxion Treasury Bull 3X',
      mer: 0.5,
      allocation: 40,
    },
  ];

  customers!: Customer[];
  sortedCustomers: Customer[]; // Sorted list based on country

  clonedCustomers: { [s: number]: Customer } = {};

  representatives!: Representative[];

  statuses!: any[];

  loading: boolean = true;

  activityValues: number[] = [0, 100];

  cols!: Column[];

  _selectedColumns!: Column[];

  weightedMER: number = 0;
  totalAllocation: number = 0;
  showError: boolean = false;

  expandedGroups: string[] = [];
  expandedRowKeys: any[] = [];

  allGroupsExpanded: boolean = false;

  groupRowsBy: ['country.name', 'representative.name'];
  multiSortMeta: [
    { field: 'country.name'; order: 1 },
    { field: 'representative.name'; order: -1 }
  ];

  constructor(
    private customerService: CustomerService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.customerService.getCustomersMedium().then((customers) => {
      this.customers = customers;
      this.loading = false;

      this.customers.forEach(
        (customer) => (customer.date = new Date(<Date>customer.date))
      );

      this.cols = [
        { field: 'name', header: 'Name', filterType: 'text' },
        { field: 'country.name', header: 'Country', filterType: 'text' },
        { field: 'representative.name', header: 'Agent', filterType: 'text' },
        { field: 'date', header: 'Date', filterType: 'date' },
        { field: 'balance', header: 'Balance', filterType: 'numeric' },
        { field: 'status', header: 'Status', filterType: 'text' },
        { field: 'activity', header: 'Activity', filterType: 'text' },
        { field: 'verified', header: 'Verified', filterType: 'boolean' },
      ];

      this._selectedColumns = this.cols;

      this.updateExpandedGroups();
      this.updateExpandedKeys();
    });

    this.representatives = [
      { name: 'Amy Elsner', image: 'amyelsner.png' },
      { name: 'Anna Fali', image: 'annafali.png' },
      { name: 'Asiya Javayant', image: 'asiyajavayant.png' },
      { name: 'Bernardo Dominic', image: 'bernardodominic.png' },
      { name: 'Elwin Sharvill', image: 'elwinsharvill.png' },
      { name: 'Ioni Bowcher', image: 'ionibowcher.png' },
      { name: 'Ivan Magalhaes', image: 'ivanmagalhaes.png' },
      { name: 'Onyama Limba', image: 'onyamalimba.png' },
      { name: 'Stephen Shaw', image: 'stephenshaw.png' },
      { name: 'Xuxue Feng', image: 'xuxuefeng.png' },
    ];

    this.statuses = [
      { label: 'Unqualified', value: 'unqualified' },
      { label: 'Qualified', value: 'qualified' },
      { label: 'New', value: 'new' },
      { label: 'Negotiation', value: 'negotiation' },
      { label: 'Renewal', value: 'renewal' },
      { label: 'Proposal', value: 'proposal' },
    ];

    // this.sortDataByCountry(); // sort data by country on initialization

    // this.updateExpandedGroups();
    // this.updateExpandedKeys();
  }

  clear(table: Table) {
    table.clear();
  }

  getSeverity(status: string) {
    switch (status.toLowerCase()) {
      case 'unqualified':
        return 'danger';

      case 'qualified':
        return 'success';

      case 'new':
        return 'info';

      case 'negotiation':
        return 'warning';

      case 'renewal':
        return null;
    }
  }
  @Input() get selectedColumns(): any[] {
    return this._selectedColumns;
  }

  set selectedColumns(val: any[]) {
    //restore original order
    this._selectedColumns = this.cols.filter((col) => val.includes(col));
  }

  generateWeightedMER() {
    this.totalAllocation = this.etfs.reduce(
      (sum, etf) => sum + etf.allocation,
      0
    );

    if (this.totalAllocation !== 100) {
      this.showError = true;
      return;
    }
    this.showError = false;

    this.weightedMER = this.etfs.reduce(
      (sum, etf) => sum + (etf.mer * etf.allocation) / 100,
      0
    );
  }

  exportExcel() {
    import('xlsx').then((xlsx) => {
      const worksheet = xlsx.utils.json_to_sheet(this.customers);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = xlsx.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });
      this.saveAsExcelFile(excelBuffer, 'customers');
    });
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    let EXCEL_TYPE =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    let EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE,
    });
    FileSaver.saveAs(
      data,
      fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION
    );
  }

  onRowEditInit(customer: Customer) {
    this.clonedCustomers[customer.id as number] = { ...customer };
  }

  onRowEditSave(customer: Customer) {
    if (customer.activity > 0) {
      delete this.clonedCustomers[customer.id as number];
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Customer is updated',
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Invalid Value',
      });
    }
  }

  onRowEditCancel(customer: Customer, index: number) {
    this.customers[index] = this.clonedCustomers[customer.id as number];
    delete this.clonedCustomers[customer.id as number];
  }

  sortDataByCountry() {
    // Simple sort operation based on country. Adjust as needed.
    this.sortedCustomers = [...this.customers].sort((a, b) =>
      a.country.name.localeCompare(b.country.name)
    );
  }

  updateExpandedGroups() {
    const uniqueCountries = [
      ...new Set(this.customers.map((customer) => customer.country.name)),
    ];
    this.expandedGroups = uniqueCountries;
    JSON.stringify(this.expandedGroups);
  }

  updateExpandedKeys() {
    const uniqueCountries = [
      ...new Set(this.customers.map((customer) => customer.country.name)),
    ];

    uniqueCountries.forEach((element, index) => {
      const obj = {};
      let propertyName = element;
      obj[propertyName] = true;
      this.expandedRowKeys.push(obj);
    });

    console.log('expandedRowKeys: ' + JSON.stringify(this.expandedRowKeys));
  }

  getStatusSeverity(status: string) {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
    }
  }

  calculateCustomerTotal(name: string) {
    let total = 0;

    if (this.customers) {
      for (let customer of this.customers) {
        if (customer.representative?.name === name) {
          total++;
        }
      }
    }

    return total;
  }
}
