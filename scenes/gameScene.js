import "@babylonjs/loaders"

function createGround(scene, BABYLON){
    const { Vector3, Color3, Texture,  MeshBuilder, StandardMaterial } = BABYLON
    
    const ground = MeshBuilder.CreateGround("ground", { width: 50, height: 50}, scene)

    const groundMat = new StandardMaterial("groundMat", scene)
    const diffuseTex = new Texture("./textures/groundTexDiffuse.jpg", scene)
    const normalTex = new Texture("./textures/groundTexNormal.jpg", scene)
    groundMat.diffuseTexture = diffuseTex
    groundMat.normalTexture = normalTex

    diffuseTex.uScale = 10
    diffuseTex.vScale = 10
    normalTex.uScale = 10
    normalTex.vScale = 10

    groundMat.specularColor = new Color3(0,0,0)

    ground.material = groundMat
}

async function gameScene (BABYLON, engine, currentScene){
    const { ActionManager, ExecuteCodeAction, SceneLoader, Vector3, Scene,  MeshBuilder, StandardMaterial, FreeCamera, HemisphericLight } = BABYLON
    
    let isMoving = false
    let charSpeed = 4
    const scene = new Scene(engine)

    const cam = new FreeCamera("camera", new Vector3(0,0,-5), scene)

    const light = new HemisphericLight("lighsa", new Vector3(0,10,0), scene)

    const Model = await SceneLoader.ImportMeshAsync("", "./models/", "character.glb", scene)
    const anims = Model.animationGroups    
    anims.forEach(anim => anim.name === "idle" && anim.play(true))
    
    const character = MeshBuilder.CreateBox("character", {size: 1, height: 2}, scene)
    character.position.y += 1
    Model.meshes[0].parent = character
    Model.meshes[0].position.y -= 1
    character.isVisible = false

    const targetBx = MeshBuilder.CreateBox("target", {size: .2},scene)
    targetBx.actionManager = new ActionManager(scene)
    targetBx.actionManager.registerAction(new ExecuteCodeAction(
        {
            trigger: ActionManager.OnIntersectionEnterTrigger,
            parameter: character
        }, () => {
            stop()            
        }
    ))
    targetBx.isVisible = false

    createGround(scene, BABYLON)
    
    const cameraContainer = MeshBuilder.CreateGround("ground", { width: .5, height: .5}, scene)
    cameraContainer.position = new Vector3(0,15,0)
    cam.parent = cameraContainer
    cam.setTarget(new Vector3(0,-10,0))

    let camVertical = 0
    let camHorizontal = 0
    let camSpd = 3
    // camera
    window.addEventListener("keydown", e => {
        const theKey = e.key.toLowerCase()
        
        if(theKey === "arrowup") camVertical = 1
        if(theKey === "arrowdown") camVertical = -1
        if(theKey === "arrowleft") camHorizontal = -1
        if(theKey === "arrowright") camHorizontal = 1
    })
    window.addEventListener("keyup", e => {
        const theKey = e.key.toLowerCase()
        
        if(theKey === "arrowup") camVertical =0
        if(theKey === "arrowdown") camVertical = 0
        if(theKey === "arrowleft") camHorizontal = 0
        if(theKey === "arrowright") camHorizontal =0
    })

    function stop(){
        isMoving = false
        anims.forEach(anim => anim.name === "running" && anim.stop())
    }
    function move(){
        
        const pickInfo = scene.pick(scene.pointerX, scene.pointerY)
        const {x,y,z} = pickInfo.pickedPoint
        targetBx.position = new Vector3(x,.25,z)
        character.lookAt(new Vector3(x, character.position.y, z), 0,0,0)
        const distance = Vector3.Distance(targetBx.position, character.position)
        console.log(distance)
        if(distance < 1.2) return console.log("very near")
        anims.forEach(anim => anim.name === "running" && anim.play(true))
        isMoving = true
    }

    scene.onPointerDown = e => {
        if(e.buttons === 1) move()
    }

    scene.registerAfterRender(() => {
        const deltaTime = engine.getDeltaTime()/1000
        cameraContainer.locallyTranslate(new Vector3(camHorizontal * camSpd * deltaTime,0,camVertical * camSpd *deltaTime))
        if(isMoving) character.locallyTranslate(new Vector3(0,0, charSpeed * deltaTime))
    })
    await scene.whenReadyAsync()
    currentScene.dispose()
    return scene
}

export default gameScene