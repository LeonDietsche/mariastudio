export function isMobile(){
    if(window.innerWidth <= 1275){
        return true;
    }else{
        return false;
    }
}


export default {
    isMobile
};