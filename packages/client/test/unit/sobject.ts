import { SteedosClient } from '../../src';
import { expect } from 'chai';

const client = new SteedosClient();
//设置服务地址
client.setUrl('http://192.168.3.2:5000/test');

before(async function () {
  let userProfile: any =  await client.login('chenzhipei@hotoa.com', '1');
  //设置认证信息
  client.setToken(userProfile.token);
  //设置所属工作区
  client.setSpaceId("jYgTB7xC3ScqmXYdW");
});

describe('Test SObject: ', () => {
    it('find', async () => {
        const results: Array<any> = await client.sobject('accounts').find(['name', '=', 'test1'], ['name'], {$top: 2, $count: true})
        expect(results.length).to.gt(0);
    });
    it('findOne', async () => {
        //TODO
        expect('TODO').to.equal('TODO');
    });
});