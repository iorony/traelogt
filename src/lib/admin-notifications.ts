export type AdminNotification={id:string;kind:"order"|"quote";title:string;detail:string;href:string;createdAt:string};
export type AdminNotificationSummary={items:AdminNotification[];orderCount:number;quoteCount:number};
