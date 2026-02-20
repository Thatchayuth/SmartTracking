BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(1000) NOT NULL,
    [employee_code] NVARCHAR(1000) NOT NULL,
    [full_name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [password_hash] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000),
    [is_active] BIT NOT NULL CONSTRAINT [users_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [users_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_employee_code_key] UNIQUE NONCLUSTERED ([employee_code]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[roles] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [roles_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [roles_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [roles_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[user_roles] (
    [user_id] NVARCHAR(1000) NOT NULL,
    [role_id] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [user_roles_pkey] PRIMARY KEY CLUSTERED ([user_id],[role_id])
);

-- CreateTable
CREATE TABLE [dbo].[refresh_tokens] (
    [id] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [expires_at] DATETIME2 NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [refresh_tokens_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [refresh_tokens_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [refresh_tokens_token_key] UNIQUE NONCLUSTERED ([token])
);

-- CreateTable
CREATE TABLE [dbo].[trips] (
    [id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [trips_status_df] DEFAULT 'Started',
    [started_at] DATETIME2 NOT NULL CONSTRAINT [trips_started_at_df] DEFAULT CURRENT_TIMESTAMP,
    [ended_at] DATETIME2,
    [total_distance] FLOAT(53),
    [total_duration] INT,
    [note] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [trips_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [trips_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[trip_segments] (
    [id] NVARCHAR(1000) NOT NULL,
    [trip_id] NVARCHAR(1000) NOT NULL,
    [segment_order] INT NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [trip_segments_status_df] DEFAULT 'Active',
    [started_at] DATETIME2 NOT NULL CONSTRAINT [trip_segments_started_at_df] DEFAULT CURRENT_TIMESTAMP,
    [ended_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [trip_segments_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [trip_segments_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[gps_points] (
    [id] NVARCHAR(1000) NOT NULL,
    [trip_id] NVARCHAR(1000) NOT NULL,
    [segment_id] NVARCHAR(1000) NOT NULL,
    [latitude] FLOAT(53) NOT NULL,
    [longitude] FLOAT(53) NOT NULL,
    [accuracy] FLOAT(53),
    [speed] FLOAT(53),
    [heading] FLOAT(53),
    [recorded_at] DATETIME2 NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [gps_points_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [gps_points_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [trips_user_id_started_at_idx] ON [dbo].[trips]([user_id], [started_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [trips_status_idx] ON [dbo].[trips]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [trip_segments_trip_id_segment_order_idx] ON [dbo].[trip_segments]([trip_id], [segment_order]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [gps_points_trip_id_recorded_at_idx] ON [dbo].[gps_points]([trip_id], [recorded_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [gps_points_segment_id_recorded_at_idx] ON [dbo].[gps_points]([segment_id], [recorded_at]);

-- AddForeignKey
ALTER TABLE [dbo].[user_roles] ADD CONSTRAINT [user_roles_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[user_roles] ADD CONSTRAINT [user_roles_role_id_fkey] FOREIGN KEY ([role_id]) REFERENCES [dbo].[roles]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[refresh_tokens] ADD CONSTRAINT [refresh_tokens_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[trips] ADD CONSTRAINT [trips_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[trip_segments] ADD CONSTRAINT [trip_segments_trip_id_fkey] FOREIGN KEY ([trip_id]) REFERENCES [dbo].[trips]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[gps_points] ADD CONSTRAINT [gps_points_trip_id_fkey] FOREIGN KEY ([trip_id]) REFERENCES [dbo].[trips]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[gps_points] ADD CONSTRAINT [gps_points_segment_id_fkey] FOREIGN KEY ([segment_id]) REFERENCES [dbo].[trip_segments]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
