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
        "name":"ドンタコス"
    },
};

$("#id_a_trg").on("click",()=>{
    params.set("uuid","staff_A");
    location.href = location.href.split("?")[0] +"?"+ params.toString();
});

$("#id_b_trg").on("click",()=>{
    params.set("uuid","staff_B");
    location.href = location.href.split("?")[0] +"?"+ params.toString();
});

$("#change_trg").on("click",()=>{
    $("#id_window").show();
});

if(!params.has("uuid")){
    $("#id_window").show();
}

window.uuid = params.get("uuid");
console.log(uuid);

$("#complete_trg").on("click",e=>{
    $("#complete_window").show();
});
$("#cancel_comp_trg").on("click",e=>{
    $("#complete_window").hide();
});
$("#accept_comp_trg").on("click",e=>{
    $("#complete_window").hide();
    $("#wait_window").show();
    $("#wait_window").text("完了処理中");
    fetch(SERVER_ADDRESS,{
        method:"POST",
        headers: {
            'Content-Type': 'text/plain'
        },
        body: JSON.stringify({
            type:"complete",
            uuid:window.order_uuid
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
        if(data.result == "OK"){
            $("#wait_window").hide();
            $("#alert_window p").text("完了しました。");
            $("#alert_window").show();
            console.log(data);
        }else{
            throw new Error(`ServerException: ${data.result}`);
        }
    })
    .catch(e => {
        $("#wait_window").hide();
        $("#alert_window p").text(`完了処理に失敗しました。少し時間を空けてから再度行ってください。\n(${e.name}:${e.message})`);
        $("#alert_window").show();
        console.error('There was a problem with the fetch operation:', e);
    });
});

$("#alert_close_trg").on("click",()=>{
    $("#alert_window").hide();
    if($("#alert_window p").text() == "完了しました。"){
        reload_assignment();
    }
});

$("#assign_trg").on("click",reload_assignment);
function reload_assignment(){
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
            window.order_uuid = data.order_uuid;
            $("#order_uuid").text(window.order_uuid);

            $("#complete_trg").show();
            $("#assign_trg").hide();

        }else if(data.result == "NoJob"){
            $("#order_id").text("現在割り当てなし");
            $("#seat_id").text("");
            $("#total_price").text("");
            $("#order_list").text("");
            $("#wait_window").hide();

            $("#complete_trg").hide();
            $("#assign_trg").show();
        }else{
            throw new Error(`ServerException: ${data.result}`);
        }
    })
    .catch(e => {
        $("#wait_window").text(`割り当ての取得に失敗しました。少し時間を空けてからページを再読込してください。\n(${e.name}:${e.message})`);
        $("#wait_window").show();
        console.error('There was a problem with the fetch operation:', e);
    });
}

reload_assignment();

}

window.SERVER_ADDRESS = "https://script.google.com/macros/s/AKfycbzcC6BAv4YC3DLHGX4RxLZL1ro8YcS-KJJwauU8rZSp0weYaekcyuMI-EQOfGJcwsW0Kw/exec";
