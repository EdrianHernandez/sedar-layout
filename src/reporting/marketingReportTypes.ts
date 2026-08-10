import type { Appointment } from '../types/appointment'
import type { Contract } from '../types/contract'
import type { Customer } from '../types/customer'
import type { Quotation } from '../types/quotation'
import type { ServiceRequest } from '../types/serviceRequest'

export type ReportTab='overview'|'requests'|'quotations'|'contracts'|'customers'|'appointments'|'representatives'
export type DatePreset='today'|'7-days'|'30-days'|'month'|'previous-month'|'quarter'|'year'|'custom'
export interface MarketingReportFilters { from:string;to:string;preset:DatePreset;customerId:string;serviceType:string;representative:string;requestStatus:string;quotationStatus:string;contractStatus:string;appointmentType:string;compare:boolean }
export interface ReportSnapshot { customers:readonly Customer[];serviceRequests:readonly ServiceRequest[];quotations:readonly Quotation[];contracts:readonly Contract[];appointments:readonly Appointment[] }
export interface ReportQualityIssue { recordType:string;recordId:string;message:string }
export interface ReportMetric { id:string;label:string;value:number;format:'number'|'currency'|'percentage';previous?:number;description:string;drillType?:string }
export interface ReportSeriesPoint { label:string;value:number;secondary?:number;route?:string }
export interface PipelineStage extends ReportSeriesPoint { id:string;stageConversion:number|null;firstConversion:number|null;dropOff:number }
export interface MarketingReportData { snapshot:ReportSnapshot;filters:MarketingReportFilters;requests:ServiceRequest[];quotations:Quotation[];contracts:Contract[];customers:Customer[];appointments:Appointment[];metrics:ReportMetric[];pipeline:PipelineStage[];quality:ReportQualityIssue[];previous?:MarketingReportData }
