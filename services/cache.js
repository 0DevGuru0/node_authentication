const mongoose = require('mongoose');

const exec  = mongoose.Query.prototype.exec;

mongoose.Query.prototype.exec = async function(){
  
  console.log('IM ABOUT TO RUN A QUERY');
  
  const key =  await JSON.stringify(
    Object.assign({},this.getQuery(),{
    collection:this.mongooseCollection.name
    })
  );
  
  const cacheValue = await client.get(key)
  
  if(cacheValue){
    console.log('cacheValue: ',cacheValue)
  }
  
  const result = await exec.apply(this,arguments)
  console.log('result: ',result)

}