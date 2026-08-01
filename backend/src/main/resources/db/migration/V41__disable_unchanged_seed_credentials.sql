UPDATE users
SET enabled = 0,
    status = 'BLOCKED',
    updated_at = SYSUTCDATETIME()
WHERE (
        email = 'filip.djekic@slu.admin.rs'
        AND password = '$2a$12$xubu7119KQiOmhV1w1bPBOZYgI6OVCoC/JGgiO7HSZIkfFsu6xsRC'
    )
    OR (
        email IN (
            'ana.nikolic@adriatrans.company-admin.rs',
            'milan.jovanovic@adriatrans.hr-manager.rs',
            'petar.markovic@adriatrans.warehouse-manager.rs',
            'jelena.stojanovic@adriatrans.dispatcher.rs',
            'nikola.petrovic@adriatrans.driver.rs',
            'marko.savic@adriatrans.driver.rs',
            'ivana.jovanovic@adriatrans.worker.rs',
            'stefan.nikolic@adriatrans.worker.rs',
            'sara.milenkovic@adriatrans.worker.rs',
            'dejan.ilic@adriatrans.driver.rs',
            'marija.pavlovic@adriatrans.worker.rs',
            'vladimir.kostic@adriatrans.warehouse-manager.rs',
            'tamara.ristic@adriatrans.dispatcher.rs',
            'ognjen.lazic@adriatrans.worker.rs'
        )
        AND password = '$2a$10$NBqZSKuQWFxDQx5taxDczuSxfo/mwhAzngiVOPnpVAKr0RskxtaSG'
    );
