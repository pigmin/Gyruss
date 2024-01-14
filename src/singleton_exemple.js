//Singleton like class

class ClassName {
    static name = "ClassName";
   
    static get instance() {
        return (globalThis[Symbol.for(`PF_${ClassName.name}`)] ||= new this());
    }
    
    constructor() { 
    }

    init() {

    }

    detroy() {
        
    }

}

//Destructuring on ne prends que la propriété statique instance
const {instance} = ClassName;
export { instance as ClassName };
