import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost/portifolio-pessoal').then(()=>{
    console.log('Banco de dados conectado');
}).catch((err)=>{
    console.log("Erro ao conectar no banco de dados",err);
})

mongoose.Promise = global.Promise;

export default mongoose;