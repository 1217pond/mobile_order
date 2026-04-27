window.onload = ()=>{

if(!navigator.cookieEnabled){
    alert("cookieを有効化してください。プライベートモードでは無効化される場合があります。");
    return;
}

const url = new URL(window.location.href);
const params = url.searchParams;
const order_data = {
    "kebab":{
        "price":0,
        "name":"ケバブ"
    },
    "nope":{
        "price":150,
        "name":"NOPE"
    },
    "ice":{
        "price":80,
        "name":"かき氷"
    },
    "crepe":{
        "price":120,
        "name":"クレープ"
    },
    "chicken":{
        "price":130,
        "name":"焼き鳥"
    },
    "doritos":{
        "price":100,
        "name":"ドリトス"
    },
};

if(params.has("uuid")){
    Cookies.set('uuid', params.get("uuid"), {expires: 7, path: ''});
}else{
    if(Cookies.get("uuid")){
        params.set("uuid",Cookies.get("uuid"));
        location.href = location.href.split("?")[0] +"?"+ params.toString();
        return;
    }else{
        params.set("uuid",crypto.randomUUID());
        location.href = location.href.split("?")[0] +"?"+ params.toString();
        return;
    }
}

window.uuid = params.get("uuid");
console.log(uuid);

$("#qr").empty();
$("#qr").qrcode({
    text:location.href,
    width:500,height:500
});

$("#assign_trg").on("click",e=>{
    $("#wait_window").show();
    $("#wait_window").text("割り当ての取得中");
    fetch(SERVER_ADDRESS,{
        method:"POST",
        headers: {
            'Content-Type': 'text/plain'
        },
        body: JSON.stringify({
            type:"assign",
            uuid:uuid
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }else{
            throw new Error("Network response was not ok");
        }
    })
    .then(data => {
        if(data.result == "Cooking"){
            console.log(data);
            $("#wait_window").hide();
            $("#order_id").text(data.order_id);
            $("#seat_id").text(data.seat_id);
            order_text = "";
            total_price = 0;
            for(let [meal_id,meal_info] of Object.entries(order_data)){
                if(data.order[meal_id]>0){
                    order_text += `${meal_info.name} × ${data.order[meal_id]}<br>`;
                    total_price += meal_info.price * data.order[meal_id];
                }
            }
            $("#total_price").text(`¥${total_price}-`);
            $("#order_list").html(order_text);

        }else if(data.result == "NoJob"){
            $("#order_id").text("現在仕事なし");
            $("#seat_id").text("");
            $("#total_price").text("");
            $("#order_list").text("");
            $("#wait_window").hide();
        }else{
            throw new Error(`ServerException: ${data.result}`);
        }
    })
    .catch(e => {
        $("#wait_window").text(`割り当ての取得に失敗しました。少し時間を空けてからページを再読込してください。\n(${e.name}:${e.message})`);
        $("#wait_window").show();
        console.error('There was a problem with the fetch operation:', e);
    });
});


}

window.SERVER_ADDRESS = "https://script.google.com/macros/s/AKfycbzcC6BAv4YC3DLHGX4RxLZL1ro8YcS-KJJwauU8rZSp0weYaekcyuMI-EQOfGJcwsW0Kw/exec";
