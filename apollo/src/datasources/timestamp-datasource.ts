//import { KeyValueCache } from "@apollo/utils.keyvaluecache";
import { RESTDataSource } from '@apollo/datasource-rest'

export class TimeStampDatasource extends RESTDataSource {
    override baseURL = 'https://currenttimestamp.azurewebsites.net/';
    /*
    constructor(cache: KeyValueCache<string>) {
        super();
    }
    */

    async getTimestamp(): Promise<string> {
        const data = await this.get('api/timestamp');                        
        return data;
    }
}