(() => {
    const container = document.getElementById("buckshotScene");
    if (!container || !window.THREE) {
        return;
    }

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x050505, 1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.08);

    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        60
    );
    camera.position.set(0, 2.4, 6.8);
    camera.lookAt(0, 1.1, 0);

    const ambient = new THREE.AmbientLight(0x3a2323, 0.6);
    scene.add(ambient);

    const overhead = new THREE.SpotLight(0xf6c9b8, 1.2, 25, Math.PI / 5, 0.6, 1.4);
    overhead.position.set(0, 6, 2);
    overhead.target.position.set(0, 0.5, 0);
    scene.add(overhead);
    scene.add(overhead.target);

    const sideLight = new THREE.PointLight(0x8f3b3b, 0.8, 15);
    sideLight.position.set(-5, 2.5, 1);
    scene.add(sideLight);

    const makeGrainTexture = (options) => {
        const { size = 512, base = "#2a1d1d", accent = "#6b3e3a" } = options;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = accent;
        for (let i = 0; i < 1500; i += 1) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const w = Math.random() * 3;
            const h = Math.random() * 2;
            ctx.globalAlpha = 0.05 + Math.random() * 0.2;
            ctx.fillRect(x, y, w, h);
        }
        ctx.globalAlpha = 1;
        return new THREE.CanvasTexture(canvas);
    };

    const makeTileTexture = () => {
        const size = 512;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#5a4a4a";
        ctx.fillRect(0, 0, size, size);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 2;
        const step = size / 8;
        for (let i = 0; i <= size; i += step) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, size);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(size, i);
            ctx.stroke();
        }
        ctx.fillStyle = "rgba(70, 10, 10, 0.35)";
        for (let i = 0; i < 12; i += 1) {
            ctx.beginPath();
            ctx.arc(
                Math.random() * size,
                Math.random() * size,
                30 + Math.random() * 60,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        return new THREE.CanvasTexture(canvas);
    };

    const wallTexture = makeGrainTexture({
        base: "#3b2a2a",
        accent: "#5c3d3d"
    });
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(2, 2);

    const floorTexture = makeTileTexture();
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(3, 2);

    const tableTexture = makeGrainTexture({
        base: "#2f3b30",
        accent: "#7b5442"
    });
    tableTexture.wrapS = tableTexture.wrapT = THREE.RepeatWrapping;
    tableTexture.repeat.set(1, 1);

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(14, 10),
        new THREE.MeshStandardMaterial({
            map: floorTexture,
            roughness: 0.9,
            metalness: 0.05
        })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);

    const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(14, 6),
        new THREE.MeshStandardMaterial({
            map: wallTexture,
            roughness: 0.95,
            metalness: 0.1
        })
    );
    backWall.position.set(0, 3, -4);
    scene.add(backWall);

    const leftWall = backWall.clone();
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-6.5, 3, 0);
    scene.add(leftWall);

    const rightWall = backWall.clone();
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(6.5, 3, 0);
    scene.add(rightWall);

    const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(14, 10),
        new THREE.MeshStandardMaterial({
            map: wallTexture,
            roughness: 0.7,
            metalness: 0.2
        })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 6;
    scene.add(ceiling);

    const tableGroup = new THREE.Group();
    const tableBase = new THREE.Mesh(
        new THREE.BoxGeometry(7, 0.6, 4.2),
        new THREE.MeshStandardMaterial({
            color: 0x2b1c1c,
            roughness: 0.8,
            metalness: 0.2
        })
    );
    tableBase.position.set(0, 1.1, 0.3);
    tableGroup.add(tableBase);

    const tableTop = new THREE.Mesh(
        new THREE.BoxGeometry(6.6, 0.2, 3.8),
        new THREE.MeshStandardMaterial({
            map: tableTexture,
            roughness: 0.85,
            metalness: 0.05
        })
    );
    tableTop.position.set(0, 1.45, 0.3);
    tableGroup.add(tableTop);

    const markingsCanvas = document.createElement("canvas");
    markingsCanvas.width = 512;
    markingsCanvas.height = 512;
    const mctx = markingsCanvas.getContext("2d");
    mctx.fillStyle = "rgba(0, 0, 0, 0)";
    mctx.fillRect(0, 0, 512, 512);
    mctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    mctx.lineWidth = 6;
    mctx.beginPath();
    mctx.arc(256, 256, 170, 0, Math.PI * 2);
    mctx.stroke();
    mctx.strokeRect(90, 360, 120, 90);
    mctx.strokeRect(320, 120, 120, 90);
    const markingTexture = new THREE.CanvasTexture(markingsCanvas);
    const markings = new THREE.Mesh(
        new THREE.PlaneGeometry(6.6, 3.8),
        new THREE.MeshStandardMaterial({
            map: markingTexture,
            transparent: true,
            roughness: 1,
            metalness: 0
        })
    );
    markings.rotation.x = -Math.PI / 2;
    markings.position.set(0, 1.56, 0.3);
    tableGroup.add(markings);
    scene.add(tableGroup);

    const shotgunGroup = new THREE.Group();
    const stock = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.3, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x3b241a, roughness: 0.7 })
    );
    stock.position.set(0.2, 1.7, 0.2);
    shotgunGroup.add(stock);

    const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 2.6, 12),
        new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.4 })
    );
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(-1.4, 1.75, 0.2);
    shotgunGroup.add(barrel);

    const pump = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.22, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x2f2f2f, roughness: 0.6 })
    );
    pump.position.set(-0.6, 1.72, 0.2);
    shotgunGroup.add(pump);

    shotgunGroup.rotation.y = Math.PI / 7;
    shotgunGroup.position.set(0.6, 0, 0);
    scene.add(shotgunGroup);

    const shells = new THREE.Group();
    const shellMaterial = new THREE.MeshStandardMaterial({
        color: 0xb23b3b,
        roughness: 0.6,
        metalness: 0.3
    });
    for (let i = 0; i < 3; i += 1) {
        const shell = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.4, 10),
            shellMaterial
        );
        shell.rotation.z = Math.PI / 2;
        shell.position.set(-0.8 + i * 0.5, 1.7, -0.4 + i * 0.2);
        shells.add(shell);
    }
    scene.add(shells);

    const dealerSilhouette = new THREE.Mesh(
        new THREE.PlaneGeometry(2.5, 3.5),
        new THREE.MeshStandardMaterial({
            color: 0x0b0b0b,
            transparent: true,
            opacity: 0.9
        })
    );
    dealerSilhouette.position.set(0, 2.2, -3.6);
    scene.add(dealerSilhouette);

    const hangingLamp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.6, 0.5, 16),
        new THREE.MeshStandardMaterial({
            color: 0x2b2b2b,
            roughness: 0.4,
            metalness: 0.6
        })
    );
    hangingLamp.position.set(0, 5.2, 1.8);
    scene.add(hangingLamp);

    const cables = new THREE.Group();
    for (let i = 0; i < 3; i += 1) {
        const cable = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 3.5, 8),
            new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.9 })
        );
        cable.position.set(-2 + i * 2, 4.5, -2.5);
        cable.rotation.z = Math.PI / 2.4;
        cables.add(cable);
    }
    scene.add(cables);

    let frame = 0;
    const animate = () => {
        frame += 0.01;
        const sway = Math.sin(frame) * 0.05;
        camera.position.x = Math.sin(frame * 0.4) * 0.3;
        camera.position.y = 2.4 + Math.sin(frame * 0.6) * 0.08;
        camera.lookAt(0, 1.1, 0);
        overhead.intensity = 1.1 + Math.sin(frame * 2) * 0.1;
        dealerSilhouette.position.y = 2.2 + sway * 0.2;
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
        const { clientWidth, clientHeight } = container;
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight);
    };

    window.addEventListener("resize", handleResize);
})();
